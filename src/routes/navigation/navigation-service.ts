import { CommonActions, createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "@/types/router/navigation";

export const navRef = createNavigationContainerRef<RootStackParamList>();

export function openLoginModal(): void {
  if (!navRef.isReady()) return;
  navRef.dispatch(CommonActions.navigate("Login" as never));
}

export function openLogoutModal(username: string): void {
  if (!navRef.isReady()) return;
  navRef.dispatch(CommonActions.navigate({ name: "Logout" as never, params: { username } as never }));
}

export function resetToHome(): void {
  if (!navRef.isReady()) return;
  navRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: "Home" as never }],
    })
  );
}
