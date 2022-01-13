package com.utils;

import java.io.Serializable;
import java.util.HashMap;

// import com.urovo.pos2.model.db.TranslogModel;

/**
 * pos传入参数类
 * 
 * @author Administrator
 *
 */
public class PosInputDatas implements Serializable
{
	private static final long serialVersionUID = 1L;
	private String UserNo = ""; // 员工号
	private String NodeID = ""; // 机构ID
	private String DevNo = ""; // PDA SN�?
	private String Amt = ""; // 金额
	private String szPINData = ""; // 持卡人密
	private String pzNumber = ""; // 凭证号
	private String bacthNo = ""; // 批次号
	private String Pan = ""; // 帐号
	private String Track2 = ""; // 二磁
	private String Track3 = ""; // 三磁
	private String szExpDate = ""; // 卡有效期
	private String szCardSeqNo = ""; // 卡片序列号
	private String pinPad = ""; // 卡片密码类型
	private String sWayNumber = ""; // 运单号或订单号
	private int SwipedMode = 0; // 表明是插卡还是刷卡或是挥卡
	private int iTransNo = 0; // 当前的交易类型?
	private String refString = ""; // 参考号
	private String date; // 交易时间
	private String stageTime; // 分期时间
	private String file55; // 55域
	private int indexId;
	private String time;
	private String qianMing; // 签名
	// private TranslogModel translogModel; // 挥卡上送

	private String yhTransNo; // 一嗨交易类型 或转入卡号
	private String oilMass; // 油量 或转入卡磁道2信息
	private String mileage; // 里程 或 转入卡密码
	private byte SwipedModeTwo = 0; // 非指定圈存转入卡 表明是插卡还是刷卡或是挥卡

	private String qbpocAmt; // 优惠卷优惠金额
	private String qbpocCardamt; // 优惠卷需支付金额
	private int qbpocInt; // 优惠明细数
	private String qbpocmessage; // 优惠明细信息
	private int mark; // 标示是否属于优惠消费

	private String install; // 分期手续费字符方式

	private boolean isCzc; // 是否属于出租车
	private String internal; // 内部商户号

	private String ECBlance;// 电子现金余额


	private String pwdCount;// 输入密码次数
	private String cvmStartRet;// 返回cvm值
	private String offlinePin;   //脱机pin
	private boolean isOnlinePin = true;   //是否联机pin

	private String remark1;
	private String remark2;
	private String remark3;
	private String remark4;
	
	private int OrderAmount;//订单金额
	private String TransNumber;//银联订单号
	private String MerID;//银联商户号
	private String OrderTime;//订单时间
	private String OrderNumber;//订单号

	public int getOrderAmount() {
		return OrderAmount;
	}

	public void setOrderAmount(int orderAmount) {
		OrderAmount = orderAmount;
	}

	public String getTransNumber() {
		return TransNumber;
	}

	public void setTransNumber(String transNumber) {
		TransNumber = transNumber;
	}

	public String getMerID() {
		return MerID;
	}

	public void setMerID(String merID) {
		MerID = merID;
	}

	public String getOrderTime() {
		return OrderTime;
	}

	public void setOrderTime(String orderTime) {
		OrderTime = orderTime;
	}

	public String getOrderNumber() {
		return OrderNumber;
	}

	public void setOrderNumber(String orderNumber) {
		OrderNumber = orderNumber;
	}

	public void setOnlinePin(boolean isOnlinePin) {
		this.isOnlinePin = isOnlinePin;
	}

	private HashMap<String, Object> map;// 用于存储自定义字段


	public boolean isOnlinePin(){
		return isOnlinePin;
	}

	public void setIsOnlinePin(boolean isOnlinePin){
		this.isOnlinePin = isOnlinePin;
	}
	public String getOfflinePin(){
		return offlinePin;
	}

	public void setOfflinePin(String offlinePin){
		this.offlinePin = offlinePin;
	}

	public HashMap<String, Object> getMap()
	{
		return map;
	}

	public void setMap(HashMap<String, Object> map)
	{
		this.map = map;
	}

	public String getInternal()
	{
		return internal;
	}

	public void setInternal(String internal)
	{
		this.internal = internal;
	}

	public String getBacthNo()
	{
		return bacthNo;
	}

	public void setBacthNo(String bacthNo)
	{
		this.bacthNo = bacthNo;
	}

	public boolean isCzc()
	{
		return isCzc;
	}

	public void setCzc(boolean isCzc)
	{
		this.isCzc = isCzc;
	}

	public String getInstall()
	{
		return install;
	}

	public void setInstall(String install)
	{
		this.install = install;
	}

	public int getMark()
	{
		return mark;
	}

	public void setMark(int mark)
	{
		this.mark = mark;
	}

	public String getQbpocCardamt()
	{
		return qbpocCardamt;
	}

	public void setQbpocCardamt(String qbpocCardamt)
	{
		this.qbpocCardamt = qbpocCardamt;
	}

	public String getQbpocAmt()
	{
		return qbpocAmt;
	}

	public void setQbpocAmt(String qbpocAmt)
	{
		this.qbpocAmt = qbpocAmt;
	}

	public int getQbpocInt()
	{
		return qbpocInt;
	}

	public void setQbpocInt(int qbpocInt)
	{
		this.qbpocInt = qbpocInt;
	}

	public String getQbpocmessage()
	{
		return qbpocmessage;
	}

	public void setQbpocmessage(String qbpocmessage)
	{
		this.qbpocmessage = qbpocmessage;
	}

	public String getQianMing()
	{
		return qianMing;
	}

	public byte getSwipedModeTwo()
	{
		return SwipedModeTwo;
	}

	public void setSwipedModeTwo(byte swipedModeTwo)
	{
		SwipedModeTwo = swipedModeTwo;
	}

	public void setQianMing(String qianMing)
	{
		this.qianMing = qianMing;
	}

	public String getYhTransNo()
	{
		return yhTransNo;
	}

	public void setYhTransNo(String yhTransNo)
	{
		this.yhTransNo = yhTransNo;
	}

	public String getOilMass()
	{
		return oilMass;
	}

	public void setOilMass(String oilMass)
	{
		this.oilMass = oilMass;
	}

	public String getMileage()
	{
		return mileage;
	}

	public void setMileage(String mileage)
	{
		this.mileage = mileage;
	}

	public int getIndexId()
	{
		return indexId;
	}

	public void setIndexId(int indexId)
	{
		this.indexId = indexId;
	}

	public String getStageTime()
	{
		return stageTime;
	}

	public void setStageTime(String stageTime)
	{
		this.stageTime = stageTime;
	}

	public String getUserNo()
	{
		return UserNo;
	}

	public void setUserNo(String userNo)
	{
		UserNo = userNo;
	}

	public String getNodeID()
	{
		return NodeID;
	}

	public void setNodeID(String nodeID)
	{
		NodeID = nodeID;
	}

	public String getDevNo()
	{
		return DevNo;
	}

	public void setDevNo(String devNo)
	{
		DevNo = devNo;
	}

	public String getAmt()
	{
		return Amt;
	}

	public void setAmt(String amt)
	{
		Amt = amt;
	}

	public String getSzPINData()
	{
		return szPINData;
	}

	public void setSzPINData(String szPINData)
	{
		this.szPINData = szPINData;
	}

	public String getPan()
	{
		return Pan;
	}

	public void setPan(String pan)
	{
		Pan = pan;
	}

	public String getTrack2()
	{
		return Track2;
	}

	public void setTrack2(String track2)
	{
		Track2 = track2;
	}

	public String getTrack3()
	{
		return Track3;
	}

	public void setTrack3(String track3)
	{
		Track3 = track3;
	}

	public String getSzExpDate()
	{
		return szExpDate;
	}

	public void setSzExpDate(String szExpDate)
	{
		this.szExpDate = szExpDate;
	}

	public String getsWayNumber()
	{
		return sWayNumber;
	}

	public void setsWayNumber(String sWayNumber)
	{
		this.sWayNumber = sWayNumber;
	}

	public int getSwipedMode()
	{
		return SwipedMode;
	}

	public void setSwipedMode(int swipedMode)
	{
		SwipedMode = swipedMode;
	}

	public int getiTransNo()
	{
		return iTransNo;
	}

	public void setiTransNo(int iTransNo)
	{
		this.iTransNo = iTransNo;
	}

	public String getPzNumber()
	{
		return pzNumber;
	}

	public void setPzNumber(String pzNumber)
	{
		this.pzNumber = pzNumber;
	}

	public String getRefString()
	{
		return refString;
	}

	public void setRefString(String refString)
	{
		this.refString = refString;
	}

	public String getDate()
	{
		return date;
	}

	public void setDate(String date)
	{
		this.date = date;
	}

	public String getTime()
	{
		return time;
	}

	public void setTime(String time)
	{
		this.time = time;
	}

	public String getFile55()
	{
		return file55;
	}

	public void setFile55(String file55)
	{
		this.file55 = file55;
	}

	public static long getSerialversionuid()
	{
		return serialVersionUID;
	}

	// public TranslogModel getTranslogModel()
	// {
	// 	return translogModel;
	// }

	// public void setTranslogModel(TranslogModel translogModel)
	// {
	// 	this.translogModel = translogModel;
	// }

	public String getRemark1()
	{
		return remark1;
	}

	public void setRemark1(String remark1)
	{
		this.remark1 = remark1;
	}

	public String getRemark2()
	{
		return remark2;
	}

	public void setRemark2(String remark2)
	{
		this.remark2 = remark2;
	}

	public String getRemark3()
	{
		return remark3;
	}

	public void setRemark3(String remark3)
	{
		this.remark3 = remark3;
	}

	public String getRemark4()
	{
		return remark4;
	}

	public void setRemark4(String remark4)
	{
		this.remark4 = remark4;
	}

	public String getSzCardSeqNo()
	{
		return szCardSeqNo;
	}

	public void setSzCardSeqNo(String szCardSeqNo)
	{
		this.szCardSeqNo = szCardSeqNo;
	}

	public String getPinPad()
	{
		return pinPad;
	}

	public void setPinPad(String pinPad)
	{
		this.pinPad = pinPad;
	}

	public String getECBlance()
	{
		return ECBlance;
	}

	public void setECBlance(String eCBlance)
	{
		ECBlance = eCBlance;
	}
	public String getPwdCount() {
		return pwdCount;
	}

	public void setPwdCount(String pwdCount) {
		this.pwdCount = pwdCount;
	}

	public String getCvmStartRet() {
		return cvmStartRet;
	}

	public void setCvmStartRet(String cvmStartRet) {
		this.cvmStartRet = cvmStartRet;
	}

}
