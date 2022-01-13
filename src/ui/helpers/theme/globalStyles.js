import { StyleSheet } from 'react-native';
import {WP as wp }from './responsive'
export const GLOBAL_SHEET = StyleSheet.create({
    dob: {
        width: 0,
        height: 0,
        opacity: 0
    },
    wp100:{
        height:wp(100),width:wp(100)
    },
    toastContainerStyle: {
        width: '80%'
    },
    maxHW:{
        height:'100%',width:'100%'
    },

    maxHWC:{
        height:'100%',width:'100%',alignItems:'center'
    },
    maxHWCC:{
        height:'100%',width:'100%',alignItems:'center',justifyContent:'center'
    },
    boxWithShadow: {
        shadowColor: '#d8d8d8',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation:1
    },


    flexrow:{
        flexDirection:'row'
    }
})