let vault
let tokenManager
let token
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

module.exports = {
  postDao: async function({ _experimentalAppInstaller, log }, bre) {
    const bigExp = (x, y) =>
      bre.web3.utils
        .toBN(x)
        .mul(bre.web3.utils.toBN(10).pow(bre.web3.utils.toBN(y)))
    pct16 = (x) => bigExp(x, 16)
    accounts = await bre.web3.eth.getAccounts()


    vault = await _experimentalAppInstaller('vault')
    tokenManager = await _experimentalAppInstaller('token-manager', { skipInitialize: true })
    log(`> Vault app installed: ${vault.address}`)
    log(`> Vault app installed: ${tokenManager.address}`)

    // Deploy a minime token an generate tokens to root account
    const minime = await _deployMinimeToken(bre)
    await minime.generateTokens(accounts[1], pct16(100))
    log(`> Minime token deployed: ${minime.address}`)

    await minime.changeController(tokenManager.address)
    log(`> Change minime controller to tokenManager app`)
    await tokenManager.initialize([minime.address, true, 0])
    log(`> tokenManager app installed: ${tokenManager.address}`)

  },

  preInit: async function({ proxy, log }, bre) {
    await vault.createPermission('TRANSFER_ROLE', proxy.address)
    log(`> TRANSFER_ROLE assigned to ${proxy.address}`)

    await tokenManager.createPermission('MINT_ROLE', proxy.address)
    log(`> MINT_ROLE assigned to ${proxy.address}`)
  },

  getInitParams: async function({}, bre) {
    return [vault.address, tokenManager.address]
  },
}

async function _deployMinimeToken(bre) {
  const MiniMeTokenFactory = await bre.artifacts.require('MiniMeTokenFactory')
  const MiniMeToken = await bre.artifacts.require('MiniMeToken')
  const factory = await MiniMeTokenFactory.new()
  const token = await MiniMeToken.new(
    factory.address,
    ZERO_ADDRESS,
    0,
    'MiniMe Test Token',
    18,
    'MMT',
    true
  )
  return token
}