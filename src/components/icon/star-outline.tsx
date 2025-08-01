import React from "react";
import Svg, { Path } from "react-native-svg";

const SvgStarOutline = ({ color = "#7B7D80", size = 24 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 17.27L18.18 21L16.54 13.97L22 9.23999L14.81 8.62999L12 2L9.19 8.62999L2 9.23999L7.46 13.97L5.82 21L12 17.27Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default SvgStarOutline;
