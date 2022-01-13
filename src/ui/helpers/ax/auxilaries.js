import React from 'react';
import { SkypeIndicator, DotIndicator } from 'react-native-indicators';
// import Toast from 'react-native-tiny-toast';
import NetInfo from "@react-native-community/netinfo";
import { GLOBAL_SHEET } from '../theme/GlobalStyles';
import { Dimensions, Clipboard, Platform, Alert } from 'react-native';
// import Geolocation from '@react-native-community/geolocation';
import Toast from 'react-native-root-toast';

export const GENERAL_ERROR_MSG = "Technical error, Please contact support.";
export const INTERNET_CONNECTION_ERROR = "Please check your internet connection and try again.";
export const TITLEBAR_HEIGHT = 50;
export const HEADER_HEIGHT = 15;
export const TAB_BAR_HEIGHT = 13;

export const Lumper = (props) => {
    return (
        props.lumper == true ? <SkypeIndicator color={props.color} /> :
            <DotIndicator color='white' size={5} />
    );
}

export const showToast = (msg) => {
    Toast.show(msg, {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,

        onShow: () => {
            // calls on toast\`s appear animation start
        },
        onShown: () => {
            // calls on toast\`s appear animation end.
        },
        onHide: () => {
            // calls on toast\`s hide animation start.
        },
        onHidden: () => {
            // calls on toast\`s hide animation end.
        }
    });
}

export const convertMonthToDate = (mon) => {
    switch (mon) {
        case 'Jan':
            return 1
        case 'Feb':
            return 2
        case 'Mar':
            return 3
        case 'Apr':
            return 4
        case 'May':
            return 5
        case 'Jun':
            return 6
        case 'Jul':
            return 7
        case 'Aug':
            return 8
        case 'Sep':
            return 9
        case 'Oct':
            return 10
        case 'Nov':
            return 11
        case 'Dec':
            return 12
    }
}

export const getConfirmation = (title, msg, callback) => {
    Alert.alert(
        title,
        msg,
        [
            {
                text: "Cancel",
                style: "cancel"
            },
            { text: "OK", onPress: callback }
        ],
        { cancelable: false }
    );
}

export const checkInternetConnection = () => {
    return new Promise(async (resolve, reject) => {
        var internet = await NetInfo.fetch();
        resolve(internet.isConnected);
    })
}

export const getScreenHeight = () => {
    return Dimensions.get('window').height;
}

export const getScreenWidth = () => {
    return Dimensions.get('window').width;
}

export const androidOrIos = () => {
    return Platform.OS;
}

// export const getCurrentLocation = () => {
//     return new Promise((resolve, reject) => {
//         Geolocation.getCurrentPosition(info => {
//             resolve(info);
//         }, (error) => {
//             reject(error);
//         }, {
//             // timeout: 5000,
//             enableHighAccuracy: false,
//         });
//     })
// }

// export const askForPermission = () => {
//     Geolocation.requestAuthorization();
// }

// export const copyToClipboard = async (msg) => {
//     await Clipboard.setString(msg);
//     showToast('Copied to clipboard');
// }

