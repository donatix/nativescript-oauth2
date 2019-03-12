import { Frame } from "tns-core-modules/ui/frame";
import {
  TnsOAuthClient,
  ITnsOAuthTokenResult,
  TnsOAuthClientLoginBlock
} from "./index";
import {
  ITnsOAuthLoginController,
  TnsOAuthLoginSubController
} from "./tns-oauth-login-sub-controller";

export class TnsOAuthLoginNativeViewController extends NSObject
  implements SFSafariViewControllerDelegate, ITnsOAuthLoginController {
  public static ObjCProtocols = [SFSafariViewControllerDelegate];

  private loginController: TnsOAuthLoginSubController = null;
  private safariViewController: SFSafariViewController;

  public static initWithClient(client: TnsOAuthClient) {
    const instance = new TnsOAuthLoginNativeViewController();
    if (instance) {
      instance.loginController = new TnsOAuthLoginSubController(client);
    }
    return instance;
  }

  public loginWithParametersFrameCompletion(
    parameters,
    frame: Frame,
    urlScheme?: string,
    completion?: TnsOAuthClientLoginBlock
  ) {
    const fullUrl = this.loginController.preLoginSetup(
      frame,
      urlScheme,
      completion
    );

    this.loginInternalWithParametersCompletion(fullUrl, frame);
  }

  private loginInternalWithParametersCompletion(
    fullUrl: string,
    frame: Frame
  ): void {
    // this.safariViewController = SFSafariViewController.alloc().initWithURLEntersReaderIfAvailable(
    //   NSURL.URLWithString(fullUrl),
    //   false
    // );

    // this.safariViewController.delegate = this;
    // frame.ios.controller.presentViewControllerAnimatedCompletion(
    //   this.safariViewController,
    //   true,
    //   null
    // );
    if (UIApplication.shared.canOpenURL(NSURL.URLWithString(fullUrl))) {
      UIApplication.shared.open(NSURL.URLWithString(fullUrl), options: [: ], completionHandler: nil)
    }

    //   if (ios.getter(UIApplication, UIApplication.sharedApplication).canOpenURL(url)) {
    //     return ios.getter(UIApplication, UIApplication.sharedApplication).openURL(url);
    // }
  }

  public resumeWithUrl(url: string): boolean {
    return this.loginController.resumeWithUrl(
      url,
      (tokenResult: ITnsOAuthTokenResult, error) => {
        if (this.safariViewController) {
          this.safariViewController.dismissViewControllerAnimatedCompletion(
            true,
            () => {
              this.loginController.completeLoginWithTokenResponseError(
                tokenResult,
                error
              );
            }
          );
        } else {
          this.loginController.completeLoginWithTokenResponseError(
            tokenResult,
            error
          );
        }
      }
    );
  }

  // SFSafariViewControllerDelegate delegate members
  public safariViewControllerDidFinish(
    controller: SFSafariViewController
  ): void {
    if (controller !== this.safariViewController) {
      // Ignore this call if safari view controller doesn't match
      return;
    }

    if (!this.loginController.authState) {
      // Ignore this call if there is no pending login flow
      return;
    }

    const er = "The login operation was canceled.";
    this.loginController.completeLoginWithTokenResponseError(null, er);
  }
}
