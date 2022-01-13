// PosDeviceSdkModule.java

package com.reactlibrary;

import java.util.List;
// import java.io.File;
import org.json.JSONObject;

import android.os.Bundle;
import android.os.RemoteException;
import android.os.Environment;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;

import com.lib.card.constant.CardTypeConstant; //-- is it available?
import com.utils.PosInputDatas; //-- Added in utils
import com.utils.DeviceHelper;

import com.urovo.smartpos.deviceservice.aidl.IPrinter;
import com.urovo.smartpos.deviceservice.aidl.PrinterListener;
import com.urovo.smartpos.deviceservice.aidl.IScanner;
import com.urovo.smartpos.deviceservice.aidl.ScannerListener;
import com.urovo.smartpos.deviceservice.aidl.IMagCardReader;
import com.urovo.smartpos.deviceservice.aidl.MagCardListener;
import com.urovo.smartpos.deviceservice.aidl.CheckCardListener;
import com.urovo.smartpos.deviceservice.aidl.EMVHandler;
import com.urovo.smartpos.deviceservice.aidl.IEMV;
import com.urovo.smartpos.deviceservice.aidl.IInsertCardReader;
import com.urovo.smartpos.deviceservice.aidl.IBeeper;



public class PosDeviceSdkModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private IPrinter iPrinter;
    private IScanner iScanner;
    private IMagCardReader iMagCardReader;
    private IInsertCardReader iInsertCardReader;
    private IEMV emvService;
    private IBeeper iBeeper;
    
    private String pan = "";
    // private PosInputDatas posInputDatas;

    private String amount = "0";
    private JSONObject cardData;
    private static String TAG = "PosDeviceSdkModule";
    private Promise mPromise;

    public PosDeviceSdkModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        DeviceHelper.getInstance().init(reactContext);
        DeviceHelper.getInstance().bindService();
                
        /*File dir = File
        if (Environment.getExternalStorageDirectory().) {
            File[] files = Environment.getDataDirectory().;
            if (files != null) {
                for(int i = 0; i<files.length; i++) {
                    Log.i(TAG, files[i].getAbsolutePath());
                }
            }
        } else {
            Log.i(TAG, "Data is not a directory");
        }*/

        // Log.i("PosDeviceSdkModule", );
        // Log.i(TAG, Environment.getExternalStorageDirectory().getAbsolutePath());
        // Log.i(TAG, Environment.getRootDirectory().getAbsolutePath());

    }

    @Override
    public String getName() {
        return "PosDeviceSdk";
    }
    

    @ReactMethod
    public void startScan(final Promise promise) {
        try {
         
            iScanner = DeviceHelper.getInstance().getScanner(1);
            Bundle param = new Bundle();
            iScanner.startScan(param, 30, new ScannerListener.Stub() {

                @Override
                public void onTimeout() throws RemoteException {
                    promise.reject("Scan timeout");
                }

                @Override
                public void onSuccess(String barcode) throws RemoteException {
                    promise.resolve(barcode);
                }

                @Override
                public void onError(int error, String errMessage) throws RemoteException {
                    promise.reject(errMessage);
                }

                @Override
                public void onCancel() throws RemoteException {
                    promise.reject("Scan canceled");
                }
            });
        } catch (RemoteException e) {
            e.printStackTrace();
            promise.reject(e.getMessage());
        } 

    }


    static class CardOptionBuilder {
        private boolean supportMagCard;
        private boolean supportICCard;
        private boolean supportRFCard;

        public CardOptionBuilder() {}

        public CardOptionBuilder supportMagCard() {
            supportMagCard = true;
            return this;
        }

        public CardOptionBuilder supportIcCard() {
            supportICCard = true;
            return this;
        }

        public CardOptionBuilder supportRfCard() {
            supportRFCard = true;
            return this;
        }

        public Bundle create() {
            Bundle option = new Bundle();
            option.putBoolean("supportMagCard", supportMagCard);
            option.putBoolean("supportICCard", supportICCard);
            option.putBoolean("supportRFCard", supportRFCard);
            return option;
        }
    }

    public void startPBOC(int cardType) {

        try {
            Bundle pbocBundle = new Bundle();
            emvService.startEMV(0, pbocBundle, emvHandler);
        } catch (RemoteException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private EMVHandler.Stub emvHandler = new EMVHandler.Stub() {

        @Override
        public void onConfirmCardInfo(Bundle track) throws RemoteException {
            iBeeper.startBeep(500);
            emvService.abortEMV();
            emvService.stopCheckCard();

            Log.i(TAG, "onConfirmCardInfo");

            for (String key : track.keySet())
            {
                Log.d(TAG, key + " = \"" + track.get(key) + "\"");
            }

            try {
                cardData = new JSONObject();
                cardData = cardData.put("PAN", track.getString("PAN"));
                cardData = cardData.put("track1", track.getString("TRACK1"));
                cardData = cardData.put("track2", track.getString("TRACK2"));
                cardData = cardData.put("track3", track.getString("TRACK3"));
                cardData = cardData.put("expDate", track.getString("EXPIRED_DATE"));
                cardData = cardData.put("cardSeqNum", track.getString("CARD_SN"));
                Log.i(TAG, "onConfirmCardInfo - Resolving");
                Log.i(TAG, cardData.toString());
                mPromise.resolve(cardData.toString());
            } catch (Exception e) {
                e.printStackTrace();
                Log.i(TAG, "onConfirmCardInfo - Rejecting");
                mPromise.reject("UnKown Error");
            }
        }

        @Override
        public void onRequestOnlineProcess(Bundle track) throws RemoteException {
            Log.i(TAG, "onRequestOnlineProcess");
        }

        @Override
        public void onShowMessage(String s) throws RemoteException{
            Log.i(TAG, "onShowMessage");
        }

        @Override
        public void onRequestFinalConfirm() throws RemoteException{
            Log.i(TAG, "onRequestFinalConfirm");
        }

        @Override
        public void onRequestProcGPO() throws RemoteException {
            Log.i(TAG, "onRequestProcGPO");
        }

        @Override
        public void onRequestAmount() throws RemoteException {
            Log.i(TAG, "onRequestAmount");
        }

        @Override
        public void onSelectApplication(List<String> appList) throws RemoteException {
            Log.i(TAG, "onSelectApplication");
        }

        @Override
        public void onRequestInputPIN(final boolean isOnlinePin, int retryTimes) throws RemoteException {
            Log.i(TAG, "onRequestInputPIN");
        }

        @Override
        public void onConfirmCertInfo(String certType, String certInfo) throws RemoteException {
            Log.i(TAG, "onConfirmCertInfo");
        }

        @Override
        public void onTransactionResult(int result, Bundle data) throws RemoteException {
            Log.i(TAG, "onTransactionResult");
        }

    };


    @ReactMethod
    public void checkCard(final Promise promise) {

        mPromise = promise;

        try {

            if (emvService == null) {
                emvService = DeviceHelper.getInstance().getEMV();
            }
            
            if (emvService == null) {
                promise.reject("Get EMV Error");
            }

            iBeeper = DeviceHelper.getInstance().getBeeper(); 

            Bundle bundle = new CardOptionBuilder().supportIcCard().supportRfCard().supportMagCard().create();
            // if(payCardType==1){
            //     bundle = new CardOptionBuilder().supportIcCard().supportRfCard().create();
            // }else{
            //     bundle = new CardOptionBuilder().supportMagCard().create();
            // }
            // com.lib.log.Log.printLog(TAG+"===checkCard");
            emvService.checkCard(bundle, 30 * 1000, new CheckCardListener.Stub() {
               
                @Override
                public void onTimeout() throws RemoteException {
                    emvService.stopCheckCard();
                    promise.reject("Swipe timeout");
                }

                @Override
                public void onError(int error, String errMessage) throws RemoteException {
                    emvService.stopCheckCard();
                    promise.reject(errMessage);
                }

                @Override
                public void onCardSwiped(Bundle track) throws RemoteException{
                    iBeeper.startBeep(500);
                    emvService.abortEMV();
                    emvService.stopCheckCard();

                    for (String key : track.keySet())
                    {
                        Log.d("Bundle Debug", key + " = \"" + track.get(key) + "\"");
                    }

                    try {
                        cardData = new JSONObject();
                        cardData = cardData.put("PAN", track.getString("PAN"));
                        cardData = cardData.put("track1", track.getString("TRACK1"));
                        cardData = cardData.put("track2", track.getString("TRACK2"));
                        cardData = cardData.put("track3", track.getString("TRACK3"));
                        cardData = cardData.put("expDate", track.getString("EXPIRED_DATE"));
                        cardData = cardData.put("swipeMode", CardTypeConstant.MSR);
                        promise.resolve(cardData.toString());
                    } catch (Exception e) {
                        e.printStackTrace();
                        promise.reject("UnKown Error");
                    }
                }

                @Override
                public void onCardActivate() throws RemoteException{
                    Log.i(TAG, "on Card Activate");
                    startPBOC(1);
                }

                @Override
                public void onCardPowerUp() throws RemoteException{
                    Log.i(TAG, "On Card Power up");
                    startPBOC(0);
                }
            });
        }catch (Exception e){
            e.printStackTrace();
        }
    }



    private Bundle formatText(JSONObject fmt) {
         Bundle format = new Bundle();

         String align = fmt.optString("align"); 
         String font = fmt.optString("font");
         String fontName = fmt.optString("fontName");

         if (align == "") {
            format.putInt("align", Integer.parseInt(align));    
         }

         if (font == "") {
            format.putInt("font", Integer.parseInt(font));
         }

         if (fontName == "") {
            format.putString("fontName", fontName);
         }

         return format;
    }

    @ReactMethod
    public void printReceipt(String jsonReceipt, final Promise promise) {
        try {

            Log.i(TAG, jsonReceipt);
            JSONObject json = new JSONObject(jsonReceipt);
            
            //font;  0:small,1:normal(D),2:large
            //align; 0:left(D),1:center,2:right
            //newline true(D), false 


            iPrinter = DeviceHelper.getInstance().getPrinter(); 
            iPrinter.setGray(10);
          
            Bundle format = new Bundle();
            String fontFile = Environment.getExternalStorageDirectory()+"/Android/data/roboto.ttf";

            format = new Bundle();
            format.putInt("font", 2);
            format.putInt("align", 1);
            format.putString("fontName", fontFile);
            iPrinter.addText(format, "RECEIPT");

            JSONObject operator = json.optJSONObject("operator");

            if (operator != null) {
                //Center/Big
                String operatorName = operator.optString("name");
                if (operatorName != "") {
                    format = new Bundle();
                    // format.putInt("font", 1);
                    format.putInt("align", 1);
                    // format.putString("fontName", fontFile);
                    iPrinter.addText(format, operatorName);
                }


                //Center/Big
                String operatorWebsite = operator.optString("website");
                if (operatorWebsite != "") {
                    format = new Bundle();
                    format.putInt("align", 1);
                    format.putString("fontName", fontFile);
                    iPrinter.addText(format, operatorWebsite);
                }

                //Center/Big
                String operatorEmail = operator.optString("email");
                if (operatorEmail != "") {
                    format = new Bundle();
                    format.putInt("align", 1);
                    format.putString("fontName", fontFile);
                    iPrinter.addText(format, operatorEmail);
                }

                //Center/Big
                String operatorPhone = operator.optString("phone");
                if (operatorPhone != "") {
                    format = new Bundle();
                    format.putInt("align", 1);
                    format.putString("fontName", fontFile);
                    iPrinter.addText(format, operatorPhone);
                }

                //Center/Big
                String operatorCompany = operator.optString("company");
                if (operatorCompany != "") {
                    format = new Bundle();
                    format.putInt("align", 1);
                    format.putString("fontName", fontFile);
                    iPrinter.addText(format, operatorCompany);
                }

                // iPrinter.feedLine(1);
            }

            //Center/Normal
            String location = json.optString("location");
            if (location != "") {
                format = new Bundle();
                format.putInt("align", 1);
                format.putString("fontName", fontFile);
                iPrinter.addText(format, location);

                // iPrinter.feedLine(1);
            }

            iPrinter.feedLine(1);

            //Add Customer
            //Center/Normal
            String customer = json.optString("customer");
            if (customer != "") {
                format = new Bundle();
                format.putString("fontName", fontFile);
                iPrinter.addText(format, "Customer: " + customer);

                // iPrinter.feedLine(1);
            }

            //Add Session
            //Center/Normal
            String session = json.optString("session");
            if (session != "") {
                format = new Bundle();
                format.putString("fontName", fontFile);
                iPrinter.addText(format, "Session");
                iPrinter.addText(format, session);

                iPrinter.feedLine(1);
            }

            //Add Transaction Details
            //Center/Normal
            String time = json.optString("time");
            if (time != "") {
                format = new Bundle();
                format.putString("fontName", fontFile);
                iPrinter.addText(format, "Time: " + time);
            }

            String direction = json.optString("direction");
            if (direction != "") {
                format = new Bundle();
                format.putString("fontName", fontFile);
                iPrinter.addText(format, "Direction: " + direction);
            }

            String fiat = json.optString("fiat");
            if (fiat != "") {
                format = new Bundle();
                format.putString("fontName", fontFile);
                iPrinter.addText(format, "Fiat: " + fiat);
            }

            String crypto = json.optString("crypto");
            if (crypto != "") {
                format = new Bundle();
                format.putString("fontName", fontFile);
                iPrinter.addText(format, "Crypto: " + crypto);
            }


            String rate = json.optString("rate");
            if (rate != "") {
                format = new Bundle();
                format.putString("fontName", fontFile);
                iPrinter.addText(format, "Rate: " + rate);
            }

            iPrinter.feedLine(1);  


            String txId = json.optString("txId");
            if (txId != "") {
                format = new Bundle();
                format.putString("fontName", fontFile);
                iPrinter.addText(format, "TXID:");

                String txId1 = txId.substring(0, txId.length()/2);
                String txId2 = txId.substring(txId.length()/2);

                if (txId1 != "") {
                    iPrinter.addText(format, txId1);
                }

                if (txId2 != "") {
                    iPrinter.addText(format, txId2);
                }

                iPrinter.feedLine(1);  

            }


            String address = json.optString("address");
            if (address != "") {
                format = new Bundle();
                format.putString("fontName", fontFile);
                iPrinter.addText(format, "Address:");

                String address1 = address.substring(0, address.length()/2);
                String address2 = address.substring(address.length()/2);

                if (address1 != "") {
                    iPrinter.addText(format, address1);
                }

                if (address2 != "") {
                    iPrinter.addText(format, address2);
                }

                iPrinter.feedLine(1);

                format = new Bundle();
                format.putInt("offset", 35);
                format.putInt("expectedHeight", 200);
                iPrinter.addQrCode(format, address);  
            }

            //Print Action
            iPrinter.startPrint(new PrinterListener.Stub() {

                @Override
                public void onFinish() throws RemoteException {
                    promise.resolve(0);
                }

                @Override
                public void onError(int error) throws RemoteException {
                    promise.reject("Error: " + error);
                }
                
            });

        } catch( RemoteException e) {
            e.printStackTrace();

            promise.reject(e.getMessage());

        } catch( Exception e) {
            e.printStackTrace();
            promise.reject(e.getMessage());

        }
        
    }

    @ReactMethod
    public void printWallet(String wallet) {

    }



}
