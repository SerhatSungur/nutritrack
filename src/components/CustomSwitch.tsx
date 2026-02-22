import React from 'react';
import { Switch, SwitchProps } from 'react-native';

export const CustomSwitch: React.FC<SwitchProps> = (props) => {
    return (
        <Switch
            {...props}
            trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
            thumbColor={'#FFFFFF'}
            // iOS specific
            ios_backgroundColor="#E5E7EB"
        />
    );
};
