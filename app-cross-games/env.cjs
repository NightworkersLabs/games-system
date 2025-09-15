 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const { cleanEnv, url } = require('envalid');

/** checks if env variables are available */
cleanEnv(process.env, {
  NEXT_PUBLIC_SECRET_PROVIDER_URL: url(),
  NEXT_PUBLIC_DOMAIN_URL: url()
});