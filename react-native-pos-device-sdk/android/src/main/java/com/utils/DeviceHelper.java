package com.utils;


import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.IBinder;
import android.os.RemoteException;
import android.util.Log;
// import android.widget.Toast;

import com.urovo.smartpos.deviceservice.aidl.IBeeper;
import com.urovo.smartpos.deviceservice.aidl.IDeviceInfo;
import com.urovo.smartpos.deviceservice.aidl.IDeviceService;
import com.urovo.smartpos.deviceservice.aidl.IEMV;
import com.urovo.smartpos.deviceservice.aidl.IInsertCardReader;
import com.urovo.smartpos.deviceservice.aidl.ILed;
import com.urovo.smartpos.deviceservice.aidl.IMagCardReader;
import com.urovo.smartpos.deviceservice.aidl.IPinpad;
import com.urovo.smartpos.deviceservice.aidl.IPrinter;
import com.urovo.smartpos.deviceservice.aidl.IRFCardReader;
import com.urovo.smartpos.deviceservice.aidl.IScanner;
import com.urovo.smartpos.deviceservice.aidl.ISerialPort;

/**
 *
 * @author baoxl
 *
 */
public final class DeviceHelper implements IBinder.DeathRecipient {
	private static final String TAG = DeviceHelper.class.getSimpleName();

	private static final String ACTION_DEVICE_SERVICE = "com.urovo.smartpos.device_service";
	private static final String PACKAGE_DEVICE_SERVICE = "com.urovo.smartpos.deviceservice";

	private static DeviceHelper sInstance = new DeviceHelper();

	private Context mContext;
	public static boolean isBindService;
	public static IDeviceService mDeviceService;

	private ServiceConnection mConnection = new ServiceConnection() {
		@Override
		public void onServiceConnected(ComponentName name, IBinder service) {
			isBindService = true;
			mDeviceService = IDeviceService.Stub.asInterface(service);
			Log.d(TAG, "-------------onServiceConnected----------");
				
		}

		@Override
		public void onServiceDisconnected(ComponentName name) {
			isBindService = false;
			Log.d(TAG, "-------------onServiceDisconnected----------");
		}

	};

	public static DeviceHelper getInstance() {
		return sInstance;
	}

	public void init(Context context) {
		mContext = context;
	}

	public void bindService() {
		if (!isBindService) {
			Intent service = new Intent(ACTION_DEVICE_SERVICE);
			service.setPackage(PACKAGE_DEVICE_SERVICE);
			boolean bindSucc = mContext.bindService(service, mConnection, Context.BIND_AUTO_CREATE);
			Log.i(TAG, "Service instance is " + service);
			Log.i(TAG, "mConnection is " + mConnection);
			if (bindSucc) {
				Log.e(TAG, "-------------bind service success----------");
			} else {
				Log.e(TAG, "-------------bind service failed----------");
			}
		}
	}

	public void unbindService() {
		if (isBindService) {
			Log.d(TAG, "-------------unbind service success----------");
			isBindService = false;
			//			mDeviceService.asBinder().unlinkToDeath(this, 0);
			mContext.unbindService(mConnection);
		}
	}


	public IDeviceService getDeviceService() {
		return mDeviceService;
	}

	public IBeeper getBeeper() {
		try {
			IBinder binder = mDeviceService.getBeeper();
			return IBeeper.Stub.asInterface(binder);
		} catch (RemoteException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			return null;
		} catch (SecurityException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			Log.d(TAG, "-------------------getBeeper SecurityException---------------");
			return null;
		}
	}

	public IDeviceInfo getDeviceInfo() {
		try {
			IBinder binder = mDeviceService.getDeviceInfo();
			return IDeviceInfo.Stub.asInterface(binder);
		} catch (RemoteException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			return null;
		} catch (SecurityException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			Log.d(TAG, "-------------------getDeviceInfo SecurityException---------------");
			return null;
		}
	}

	public IMagCardReader getMagCardReader() {
		try {
			IBinder binder = mDeviceService.getMagCardReader();
			return IMagCardReader.Stub.asInterface(binder);
		} catch (RemoteException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			return null;
		} catch (SecurityException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			Log.d(TAG, "-------------------getMagCardReader SecurityException---------------");
			return null;
		}
	}

	public IInsertCardReader getInsertCardReader() {
		try {
			IBinder binder = mDeviceService.getInsertCardReader();
			return IInsertCardReader.Stub.asInterface(binder);
		} catch (RemoteException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			return null;
		} catch (SecurityException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			Log.d(TAG, "-------------------getInsertCardReader SecurityException---------------");
			return null;
		}
	}

	public IRFCardReader getRFCardReader() {
		try {
			IBinder binder = mDeviceService.getRFCardReader();
			return IRFCardReader.Stub.asInterface(binder);
		} catch (RemoteException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			return null;
		} catch (SecurityException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			Log.d(TAG, "-------------------getRFCardReader SecurityException---------------");
			return null;
		}
	}


	public ILed getLed() {
		try {
			IBinder binder = mDeviceService.getLed();
			return ILed.Stub.asInterface(binder);
		} catch (RemoteException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			return null;
		} catch (SecurityException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			Log.d(TAG, "-------------------getLed SecurityException---------------");
			return null;
		}
	}



	public IPrinter getPrinter() {
		try {
			IBinder binder = mDeviceService.getPrinter();
			return IPrinter.Stub.asInterface(binder);
		} catch (RemoteException e) {
			e.printStackTrace();
			// throw e;
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			return null;
		} catch (SecurityException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			Log.d(TAG, "-------------------getPrinter SecurityException---------------");
			return null;
		}
	}

	public IScanner getScanner(int type) {
		try {
			IBinder binder = mDeviceService.getScanner(type);
			return IScanner.Stub.asInterface(binder);
		} catch (RemoteException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			return null;
		} catch (SecurityException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			Log.d(TAG, "-------------------getScanner SecurityException---------------");
			return null;
		}
	}

	public IPinpad getPinpad(int kapId) {
		try {
			IBinder binder = mDeviceService.getPinpad(kapId);
			return IPinpad.Stub.asInterface(binder);
		} catch (RemoteException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			return null;
		} catch (SecurityException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			Log.d(TAG, "-------------------getPinpad SecurityException---------------");
			return null;
		}
	}


	public IEMV getEMV() {
		try {
			IBinder binder = mDeviceService.getEMV();
			return IEMV.Stub.asInterface(binder);
		} catch (RemoteException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			return null;
		} catch (SecurityException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			Log.d(TAG, "-------------------getPBOC SecurityException---------------");
			return null;
		}
	}

	public ISerialPort getSerialPort(String deviceName) {
		try {
			Bundle bundle = new Bundle();
			bundle.putString("deviceName", deviceName);
			IBinder binder = mDeviceService.getSerialPort();
			return ISerialPort.Stub.asInterface(binder);
		} catch (RemoteException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			return null;
		} catch (SecurityException e) {
			e.printStackTrace();
			// Toast.makeText(mContext, e.getMessage(), Toast.LENGTH_LONG).show();
			Log.d(TAG, "-------------------getSerialPort SecurityException---------------");
			return null;
		}
	}


	@Override
	public void binderDied() {
		Log.d(TAG, "-------------binder service is dead!!!----------");
		isBindService = false;
		mDeviceService = null;
		bindService();
	}

}
