/**
 * try to extract a meaningful message from a ethers request error
 */
export function getMeaningfulMessageFromError (e: any) {
  if (e?.error?.data?.message) {
    return e.error.data.message
  } else if (e?.data?.message) {
    return e.data.message
  } else if (e?.message) {
    //
    if ((<string>e.message).indexOf('Nonce too high') >= 0) {
      return 'The nonce history of this account is out of sync with current chain nonce. ' +
                'You might want to reset your wallet transaction history by going to MetaMask > My Accounts > Parameters > Advanced > Reset Account.'
    }
    //
    return e.message
  }

  //
  return e
}
