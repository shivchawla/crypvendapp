import React from 'react'
import {Image,StyleSheet, ImagePropTypes }from 'react-native'
import * as Helpers from '../exporter'


export const leftArrow = (props) => {
    return (
        <Image
        source={Helpers.Images.backArrow}
        style={[styles.backArrow,{tintColor:props.color}]}
        />
    )

}
export const downArrow = () => {
    return (
        <Image
        source={Helpers.Images.backArrow}
        style={styles.backArrow}
        />
    )

}
const styles=StyleSheet.create({
    backArrow:{
        height:Helpers.WP(7),
        width:Helpers.WP(7),
        resizeMode:'contain',
        tintColor:Helpers.Theme.light
    }
})


