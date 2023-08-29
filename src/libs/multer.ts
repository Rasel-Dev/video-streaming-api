import multer from 'multer'
import path from 'path'
import { v4 as uuid } from 'uuid'

/**
 * Video Storage
 */
const storage = multer.diskStorage({
  //Specify the destination directory where the file needs to be saved
  destination: function (_req, _file, cb) {
    cb(null, './uploads')
  },
  //Specify the name of the file. The date is prefixed to avoid overwriting of files.
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, Date.now() + '_' + uuid() + ext)
  }
})

export default multer({
  storage: storage
})

/**
 * Thumbnail Storage
 */
const thumbnailStorage = multer.diskStorage({
  //Specify the destination directory where the file needs to be saved
  destination: function (_req, _file, cb) {
    cb(null, './uploads/thumbnails')
  },
  //Specify the name of the file. The date is prefixed to avoid overwriting of files.
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, 'thumb-' + uuid() + ext)
  }
})

export const thumbnail = multer({ storage: thumbnailStorage }).single('thumbnail')

// const buf = Buffer.alloc(100)
// const fsPromise = fs.promises

// export async function getResourceDuration(resource: string) {
//   const file = await fsPromise.open(path.resolve(resource), 'r')
//   const { buffer } = await file.read({
//     buffer: buf,
//     length: 100,
//     offset: 0,
//     position: 0
//   })
//   await file.close()

//   const header = Buffer.from('mvhd')
//   const start = buffer.indexOf(header) + 16
//   const timeScale = buffer.readUInt32BE(start)
//   const duration = buffer.readUInt32BE(start + 4)
//   const movieLength = Math.floor(duration / timeScale)

//   // console.log('buffer :', buffer)
//   // console.log('header :', header)
//   // console.log('start :', start)
//   // console.log('timeScale :', timeScale)
//   // console.log('duration :', duration / 1000 / 60 / 60)
//   // console.log('movieLength :', movieLength / 60 / 60)
//   // return {
//   //   h: Math.floor(movieLength / 60 / 60),
//   //   m: Math.floor(movieLength / 60),
//   //   s: Math.floor(movieLength)
//   // }
//   return movieLength
// }
