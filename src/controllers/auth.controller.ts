import { compare, hash } from 'bcrypt'
import { NextFunction, Request, Response } from 'express'
import { sign } from 'jsonwebtoken'
import { emailReg } from 'src/libs'
import { setJWT } from 'src/libs/cookie'
import { checkUniqueEmail, checkUniqueUsername, createNewUser, getCurrentUser, getUserByUsername } from 'src/repos/user'
import BaseController from './base.controller'

class AuthController extends BaseController {
  constructor() {
    super()
    this.routes()
  }

  private create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Like a create random record
      const errors: { [index: string]: string } = {}
      const { fullname, username, email, password } = req.body
      // console.log('req.body :', req.body)
      // 1st layer validation
      if (!fullname) errors.fullname = 'Fullname is required!'
      if (!username) errors.username = 'Username is required!'
      if (!email) errors.email = 'Email address is required!'
      if (!password) errors.password = 'Password is required!'
      // 2nd layer validation
      if (!errors?.fullname && fullname.length < 4) errors.fullname = 'Fullname at least 4 characters'
      if (!errors?.username && username.length < 4) errors.username = 'Username at least 4 characters'
      if (password && password.length < 8) errors.password = 'Password should contains at least 8 characters'
      if (email && !emailReg.test(email)) errors.email = 'Email is not valid!'

      // db check & it's called 3rd layer validation
      if (!errors.username) {
        const checkUsername = await checkUniqueUsername(username)
        if (checkUsername) errors.username = 'Username already taken!'
      }
      if (!errors.email) {
        const checkEmail = await checkUniqueEmail(email)
        if (checkEmail) errors.email = 'Email address already taken!'
      }

      if (Object.keys(errors).length) {
        res.status(400).json(errors).end()
        return
      }
      // pass 'user' object to repository/service
      const hashedPassword = await hash(password, 12)
      // create new record and return with created "id"
      const user = await createNewUser({
        fullname,
        username,
        email,
        hashedPassword
      })

      const token = sign({ aud: user?.userId, iat: Math.floor(Date.now() / 1000) - 30 }, process.env?.JWT_SECRET, {
        expiresIn: '24h'
      })
      // set token to response cookie
      setJWT(token, res)
      // response the final data
      res.json({ id: user.userId, fullname, username, email, token })
    } catch (error: any) {
      next(error)
    }
  }

  private login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body
      //validation
      if (!username || !password || (password && password.length < 8)) {
        res.status(400).json({ message: 'Incorrect login credentials!' }).end()
        return
      }

      const user = await getUserByUsername(username)
      if (!user) {
        res.status(400).json({ message: 'Incorrect login credentials!' }).end()
        return
      }

      if (!(await compare(password, user.hashedPassword))) {
        res.status(400).json({ message: 'Incorrect login credentials!' }).end()
        return
      }

      const profile = await getCurrentUser(user.userId)
      const token = sign({ aud: user?.userId, iat: Math.floor(Date.now() / 1000) - 30 }, process.env?.JWT_SECRET, {
        expiresIn: '3d'
      })
      // set token to response cookie
      setJWT(token, res)

      res.json({ id: user?.userId, ...profile, token })
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  public routes() {
    // auth
    this.router.post('/signup', this.create)
    this.router.post('/signin', this.login)

    // this._showRoutes()
  }
}

export default new AuthController()
