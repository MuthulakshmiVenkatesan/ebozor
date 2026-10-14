import { logoutSuccess } from '../redux/reuducer/authSlice'
import { store } from '@/redux/store'
import { t } from '@/utils'
import axios from 'axios'
import Swal from 'sweetalert2'

/** Local Debugbar appends `<script>`/`<link>` after JSON; live does not. Strip so parse succeeds. */
function parseJsonApiResponse(data) {
  if (typeof data !== 'string') return data
  const clean = data.split('<script')[0].split('<link')[0].trim()
  if (!clean) return data
  try {
    return JSON.parse(clean)
  } catch {
    return data
  }
}

const Api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}`,
  transformResponse: [parseJsonApiResponse],
})

let isUnauthorizedToastShown = false;

Api.interceptors.request.use(function (config) {
  let token = undefined
  let langCode = undefined

  if (typeof window !== 'undefined') {
    const state = store.getState()
    token = state?.UserSignup?.data?.token
    langCode = state?.CurrentLanguage?.language?.code
  }

  if (token) config.headers.authorization = `Bearer ${token}`
  if (langCode) config.headers['Content-Language'] = langCode

  return config
})

// Add a response interceptor
Api.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const hadAuthHeader = Boolean(error.config?.headers?.authorization)
    if (error.response && error.response.status === 401 && hadAuthHeader) {
      // Only clear session when an authenticated request was rejected (invalid/expired token).
      logoutSuccess()
      if (!isUnauthorizedToastShown) {
        Swal.fire({
          icon: "error",
          title: t('oops'),
          text: t("userDeactivatedByAdmin"),
          allowOutsideClick: false,
          customClass: {
            confirmButton: 'Swal-confirm-buttons',
          },

        })
        isUnauthorizedToastShown = true;
        // Reset the flag after a certain period
        setTimeout(() => {
          isUnauthorizedToastShown = false;
        }, 3000); // 3 seconds delay before allowing another toast
      }
    }
    return Promise.reject(error);
  }
);

export default Api
