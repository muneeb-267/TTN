/** Copy-ready amount for JazzCash / EasyPaisa / bank amount fields (no currency prefix). */
export function pkrCopyAmount(amount: number) {
  return String(Math.round(amount));
}

export function walletAppHref(method: "jazzcash" | "easypaisa") {
  return method === "jazzcash" ? "https://www.jazzcash.com.pk/" : "https://easypaisa.com.pk/";
}

export type CheckoutStep = {
  n: number;
  title: string;
  detail: string;
  copy?: string;
};

export function transferCheckoutSteps(input: {
  method: "jazzcash" | "easypaisa" | "bank";
  payee: string;
  account: string;
  amount: number;
  refCode: string;
}): CheckoutStep[] {
  const amount = pkrCopyAmount(input.amount);
  if (input.method === "bank") {
    return [
      {
        n: 1,
        title: "Open your bank or Raast app",
        detail: `Send an IBFT / Raast transfer to ${input.payee}.`,
      },
      {
        n: 2,
        title: "Paste the IBAN",
        detail: "Use the exact account shown on this page.",
        copy: input.account,
      },
      {
        n: 3,
        title: "Send the exact amount",
        detail: "A different amount cannot be matched to this booking.",
        copy: amount,
      },
      {
        n: 4,
        title: "Put the booking ref in the narration",
        detail: "This is how staff match the credit.",
        copy: input.refCode,
      },
      {
        n: 5,
        title: "Upload the receipt screenshot",
        detail: "The transfer stays pending until it is matched. This screen does not mark you paid.",
      },
    ];
  }
  const wallet = input.method === "jazzcash" ? "JazzCash" : "EasyPaisa";
  return [
    {
      n: 1,
      title: `Open ${wallet}`,
      detail: `Use Send Money to ${input.payee}.`,
    },
    {
      n: 2,
      title: "Paste the wallet number",
      detail: "Send to this number only — do not pick a random contact.",
      copy: input.account,
    },
    {
      n: 3,
      title: "Send the exact amount",
      detail: "JazzCash and EasyPaisa receipts must match this figure.",
      copy: amount,
    },
    {
      n: 4,
      title: "Put the booking ref in the message",
      detail: "Staff match TID + amount + this reference.",
      copy: input.refCode,
    },
    {
      n: 5,
      title: "Paste the TID and upload the screenshot",
      detail: "The booking stays pending until the receipt is matched. This is the same flow used on Pakistani travel sites that collect wallet transfers.",
    },
  ];
}
