import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
    width?: number;
    height?: number;
    color?: string;
};

const SvgPlus = ({ width = 24, height = 24, color = "#FFFFFF" }: Props) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export default SvgPlus;
