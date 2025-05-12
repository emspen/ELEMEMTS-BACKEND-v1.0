import speakeasy from 'speakeasy'

export const generateTotp = () => {
  const secret = speakeasy.generateSecret()
  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
    digits: 4,
  })
  return {
    token,
    secret,
  }
}

export const generateResetTotp = () => {
  const secret = speakeasy.generateSecret({length: 20}).base32
  const token = speakeasy.totp({
    secret: secret,
    encoding: 'base32',
  })
  return {
    token,
  }
}

export const regenerateTotp = (secret: string) => {
  const token = speakeasy.totp({
    secret: secret,
    encoding: 'base32',
    digits: 4,
  })

  return {
    token,
    secret,
  }
}

export const verifyTotp = (token: string, secret: string) => {
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    digits: 4,
    window: 2,
  })
  return verified
}
