import {name, version} from 'package.json'

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: `${name} API documentation`,
    version,
    license: {
      name: 'MIT',
    },
  },
}

export default swaggerDef
