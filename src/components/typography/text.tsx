import { ReactElement } from "react";
import { StyleProp, TextStyle } from "react-native";
import { Text as TextPaper, TextProps } from "react-native-paper";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";

const Text = ({ children, style, ...props }: TextProps<string>): ReactElement => {
  const { palette } = useThemeContext();

  // Default typography styling, theme-aware text color.
  let customStyle: StyleProp<TextStyle> = { color: palette.text, fontFamily: "Nota" };
  if (style) customStyle = [customStyle, style];

  // Avoid passing "key" down as a prop
  const { key, ...rest } = props as any;

  return (
    <TextPaper key={key} {...(rest as TextProps<string>)} style={customStyle}>
      {children}
    </TextPaper>
  );
};

export default Text;
