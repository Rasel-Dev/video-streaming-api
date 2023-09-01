export type JWTType = {
  aud: string
  iat: number
  exp: number
}
export type UserAuthReq = string

export type FormErr = Record<string, string | boolean>

export type ChannelDashboardQuery = {
  cid: string
  sc: string
  page?: number
}
