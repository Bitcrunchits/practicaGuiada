import { Image, StyleSheet } from "react-native";

type AppLogoProps = {
  size?: "small" | "large";
};

export function AppLogo({ size = "small" }: AppLogoProps) {
  return (
    <Image
      source={require("../../../assets/images/logo-its.png")}
      style={[
        styles.logo,
        size === "large" && styles.large,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 120,
    height: 45,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 8,
  },

  large: {
    width: 250,
    height: 100,
    marginBottom: 20,
  },
});