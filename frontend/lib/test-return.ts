export function saveTestReturnUrl(testId: number, returnUrl: string): void {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(`test_${testId}_returnTo`, returnUrl);
}

export function getTestReturnUrl(
  testId: number,
  defaultReturn: string = "/courses",
): string {
  if (typeof window === "undefined") return defaultReturn;

  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("returnTo");
  if (fromUrl) {
    return fromUrl;
  }

  const saved = sessionStorage.getItem(`test_${testId}_returnTo`);
  if (saved) {
    return saved;
  }

  return defaultReturn;
}

export function clearTestReturnUrl(testId: number): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`test_${testId}_returnTo`);
}
