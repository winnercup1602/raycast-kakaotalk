import { showHUD } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { openKakaoTalk } from "./services/automation";

export default async function OpenKakaoTalk() {
  try {
    await openKakaoTalk();
    await showHUD("KakaoTalk opened");
  } catch (error) {
    await showFailureToast(error, { title: "Could Not Open KakaoTalk" });
  }
}
