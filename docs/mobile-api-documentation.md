# Mobile API Documentation (Frontend + Backend Verified)

This document is generated after analyzing:
- Frontend client usage: `ebozor-ui/src/utils/api.js`, `ebozor-ui/src/api/AxiosInterceptors.jsx`, `ebozor-ui/src/utils/socket.js`
- Backend routes: `ebozor_admin/routes/api.php`
- Backend response helper: `ebozor_admin/app/Services/ResponseService.php`

## 1) Base URL, Headers, Auth

- Base URL format: `{API_HOST}{END_POINT}/`
  - Example: `https://api.yourdomain.com/api/`
- Frontend app sends:
  - `Authorization: Bearer <token>` when logged in
  - `Content-Language: <language_code>` when language selected
- Auth mechanism on backend: `auth:sanctum` for protected APIs.

## 2) Standard Response Format

Backend standard success response:

```json
{
  "error": false,
  "message": "Data Fetched Successfully",
  "data": {},
  "code": 200
}
```

Backend standard error response:

```json
{
  "error": true,
  "message": "Error Occurred",
  "data": null,
  "code": 500,
  "details": ""
}
```

Response fields:
- `error` (boolean): `false` on success, `true` on failure.
- `message` (string): Human-readable status text.
- `data` (object|array|null): Endpoint-specific payload.
- `code` (number|string): App-level status code from backend constants.
- `details` (string, error only): Debug detail (usually empty in production).

---

## 3) Endpoint Reference

Legend:
- Auth: `Public` or `Bearer`
- URL format uses: `{BASE}` where `{BASE} = https://api.yourdomain.com/api`

### A. System / Config / Language

1. **Get system settings**
- Method/Path: `GET /get-system-settings`
- Auth: Public
- Description: Returns app/web system settings.
- Sample URL: `{BASE}/get-system-settings?type=app`
- Sample response:
```json
{
  "error": false,
  "message": "Data Fetched Successfully",
  "data": {
    "system_name": "Ebozor",
    "currency_symbol": "AED"
  },
  "code": 200
}
```

2. **Get SEO settings**
- Method/Path: `GET /seo-settings`
- Auth: Public
- Description: SEO metadata for page contexts.
- Sample URL: `{BASE}/seo-settings?page=home`

3. **Get slider**
- Method/Path: `GET /get-slider`
- Auth: Public
- Description: Banner/slider content.
- Sample URL: `{BASE}/get-slider`

4. **Get languages**
- Method/Path: `GET /get-languages`
- Auth: Public
- Description: Localization JSON for selected language.
- Sample URL: `{BASE}/get-languages?language_code=en&type=app`

### B. Authentication / User

5. **User signup/login**
- Method/Path: `POST /user-signup`
- Auth: Public
- Description: Creates or logs in user and returns token.
- Content-Type: `multipart/form-data`
- Sample URL: `{BASE}/user-signup`
- Sample body fields: `name`, `email`, `mobile`, `firebase_id`, `type`, `country_code`, `device_name`, `fcm_id`
- Sample response:
```json
{
  "error": false,
  "message": "User logged-in successfully",
  "data": {
    "id": 101,
    "name": "John",
    "email": "john@mail.com"
  },
  "token": "1|sanctum_token_here",
  "code": 200
}
```

6. **Update profile**
- Method/Path: `POST /update-profile`
- Auth: Bearer
- Description: Updates profile attributes and profile image.
- Sample URL: `{BASE}/update-profile`

7. **Delete user**
- Method/Path: `DELETE /delete-user`
- Auth: Bearer
- Description: Deletes authenticated user account.
- Sample URL: `{BASE}/delete-user`

8. **Get notification list**
- Method/Path: `GET /get-notification-list`
- Auth: Bearer
- Description: Paginated notifications for current user.
- Sample URL: `{BASE}/get-notification-list?page=1`

9. **Set user phone number**
- Method/Path: `POST /set-user-phonenumber`
- Auth: Bearer
- Description: Updates user phone number.
- Sample URL: `{BASE}/set-user-phonenumber`

10. **Get devices**
- Method/Path: `GET /get-devices`
- Auth: Bearer
- Description: Lists logged-in devices/sessions.
- Sample URL: `{BASE}/get-devices`

11. **Logout device**
- Method/Path: `DELETE /logout-device/{id}`
- Auth: Bearer
- Description: Logs out a specific device session.
- Sample URL: `{BASE}/logout-device/12`

### C. Categories / Filters / Taxonomy

12. `GET /get-categories` (Public)  
Description: Category or sub-category listing.  
Sample URL: `{BASE}/get-categories?category_id=1&page=1`

13. `GET /get-category-children-by-parent` (Public)  
Description: Children for parent category, optional title search.  
Sample URL: `{BASE}/get-category-children-by-parent?parent_category_id=1&title=car`

14. `GET /get-category-filters` (Public)  
Description: Filter schema by category/listing slug.  
Sample URL: `{BASE}/get-category-filters?slug=property-for-rent`

15. `GET /get-category-tree-by-slug` (Public)  
Description: Full category tree for slug.  
Sample URL: `{BASE}/get-category-tree-by-slug?category_slug=jobs`

16. `GET /get-parent-categories` (Public)  
Description: Parent tree from child category.  
Sample URL: `{BASE}/get-parent-categories?child_category_id=33&tree=1`

17. `GET /get-parent-category-list` (Public)  
Description: Flat list of parent categories.  
Sample URL: `{BASE}/get-parent-category-list`

18. `GET /categoryhome` (Bearer in route group, used by frontend)  
Description: Category-home specific listing metadata.  
Sample URL: `{BASE}/categoryhome?parent_category_id=8&category-slug=property`

19. `GET /get-customfields` (Public)  
Description: Custom fields by category IDs.  
Sample URL: `{BASE}/get-customfields?category_ids=1,2,3`

20. `GET /get-customfields-by-category-id` (Public)  
Description: Custom fields for one category.  
Sample URL: `{BASE}/get-customfields-by-category-id?category_id=22`

21. `GET /job-roles` (Public)  
Description: Job-role options for job categories.  
Sample URL: `{BASE}/job-roles?category_slug=jobs-accounting`

22. `GET /search-categories-under-slug` (Public)  
Description: Search categories under a slug (autocomplete).  
Sample URL: `{BASE}/search-categories-under-slug?category_slug=jobs&text=engineer`

23. `GET /search-job-suggestion` (Public)  
Description: Job suggestion autocomplete.  
Sample URL: `{BASE}/search-job-suggestion?text=driver`

24. `GET /search-banner-suggestion` (Public)  
Description: Home banner search suggestion.  
Sample URL: `{BASE}/search-banner-suggestion?search=toyota&category_id=2&limit=12`

### D. Items / Listings

25. **Get items**
- Method/Path: `GET /get-item`
- Auth: Public
- Description: Main listing/search/detail API.
- Sample URL format:
  - `{BASE}/get-item?page=1&per_page=15&category_slug=motors&city=Dubai&sort_by=new-to-old`
  - `{BASE}/get-item?id=983` (single item)
- Common params: `id`, `category_id`, `category_slug`, `slug`, `search`, `sort_by`, `posted_since`, `city`, `state`, `country`, `min_price`, `max_price`, `latitude`, `longitude`, `radius`, dynamic filter params.
- Sample response:
```json
{
  "error": false,
  "message": "Item Fetched Successfully",
  "data": {
    "data": [
      {
        "id": 983,
        "name": "Toyota Corolla",
        "price": "35000",
        "city": "Dubai",
        "created_at": "2026-05-01T10:00:00Z"
      }
    ],
    "current_page": 1,
    "last_page": 20,
    "total": 300
  },
  "code": 200
}
```

26. `GET /my-items` (Bearer)  
Description: Authenticated user listings.  
Sample URL: `{BASE}/my-items?page=1&status=active&sort_by=new-to-old`

27. `GET /my-items-count` (Bearer)  
Description: Counts by listing status for current user.  
Sample URL: `{BASE}/my-items-count`

28. `POST /add-item` (Bearer, multipart)  
Description: Create listing with media and custom fields.  
Sample URL: `{BASE}/add-item`

29. `POST /update-item` (Bearer, multipart)  
Description: Update listing by `id`.  
Sample URL: `{BASE}/update-item`

30. `POST /delete-item` (Bearer, multipart/json accepted in backend docs)  
Description: Delete listing by `id`.  
Sample URL: `{BASE}/delete-item`

31. `POST /update-item-status` (Bearer)  
Description: Set listing status (`active`, `inactive`, `sold out`).  
Sample URL: `{BASE}/update-item-status`

32. `POST /renew-item` (Bearer)  
Description: Renew expired listing with package.  
Sample URL: `{BASE}/renew-item`

33. `POST /make-item-featured` (Bearer)  
Description: Promote listing to featured positions.  
Sample URL: `{BASE}/make-item-featured`

34. `POST /get-similar-product` (Public)  
Description: Similar items by category/item.  
Sample URL: `{BASE}/get-similar-product`

35. `POST /get-property-plan` (Public/Bearer usage in frontend)  
Description: Property unit plan details by item id.  
Sample URL: `{BASE}/get-property-plan`

36. `GET /item-buyer-list` (Bearer)  
Description: Buyers who offered on item.  
Sample URL: `{BASE}/item-buyer-list?item_id=983`

37. `GET /get-limits` (Bearer)  
Description: User package limits.  
Sample URL: `{BASE}/get-limits?package_type=item_listing`

38. `GET /get-item-count` (Public)  
Description: Total item count with current filter context.  
Sample URL: `{BASE}/get-item-count?category_slug=jobs`

### E. Home / Featured / Discovery

39. `GET /get-featured-section` (Public)  
Description: Featured section blocks and associated items.  
Sample URL: `{BASE}/get-featured-section?slug=home&city=Dubai`

40. `GET /get-home-categories` (Public)  
Description: Home screen category modules.  
Sample URL: `{BASE}/get-home-categories`

41. `GET /get-popular-categories` (Public)  
Description: Popular categories list.  
Sample URL: `{BASE}/get-popular-categories`

42. `GET /get-popular-job` (Public)  
Description: Popular jobs feed.  
Sample URL: `{BASE}/get-popular-job?category_id=10&city=Dubai`

### F. Favorites / Saved Searches

43. `POST /manage-favourite` (Bearer)  
Description: Add/remove favorite item, optionally in a favorite list.  
Sample URL: `{BASE}/manage-favourite`

44. `GET /get-favourite-item` (Bearer)  
Description: Favorite items with pagination.  
Sample URL: `{BASE}/get-favourite-item?page=1&favouritelisting_id=5`

45. `POST /favourite-listing` (Bearer)  
Description: Create/update favorite list name/type.  
Sample URL: `{BASE}/favourite-listing`

46. `POST /get-favourite-listing` (Bearer)  
Description: Fetch favorite lists for user.  
Sample URL: `{BASE}/get-favourite-listing`

47. `GET /saved-search` (Bearer)  
Description: Get saved searches.
- Sample URL: `{BASE}/saved-search?page=1`

48. `POST /saved-search` (Bearer)  
Description: Save search URL and notify preferences.  
Sample URL: `{BASE}/saved-search`

49. `POST /edit-saved-search` (Bearer)  
Description: Rename saved search.  
Sample URL: `{BASE}/edit-saved-search`

50. `POST /delete-saved-search` (Bearer)  
Description: Delete saved search by id.  
Sample URL: `{BASE}/delete-saved-search`

### G. Reviews / Reports / Moderation

51. `GET /get-report-reasons` (Public)  
Description: Report reason options.  
Sample URL: `{BASE}/get-report-reasons`

52. `POST /add-reports` (Bearer)  
Description: Report item with predefined reason.  
Sample URL: `{BASE}/add-reports`

53. `POST /ad-report` (Bearer)  
Description: Advanced report for ad spam/abuse type.  
Sample URL: `{BASE}/ad-report`

54. `POST /add-item-review` (Bearer)  
Description: Add seller/item review.  
Sample URL: `{BASE}/add-item-review`

55. `GET /my-review` (Bearer)  
Description: Current seller reviews list.  
Sample URL: `{BASE}/my-review?page=1`

56. `POST /add-review-report` (Bearer)  
Description: Report an inappropriate review.  
Sample URL: `{BASE}/add-review-report`

### H. Chat / Offer

57. **Create item offer**
- Method/Path: `POST /item-offer`
- Auth: Bearer
- Description: Create or update buyer offer for item.
- Sample URL: `{BASE}/item-offer`
- Sample body: `item_id`, `amount`

58. **Chat list**
- Method/Path: `GET /chat-list`
- Auth: Bearer
- Description: Buyer/seller chat inbox.
- Sample URL: `{BASE}/chat-list?type=buyer&page=1`

59. **Chat messages**
- Method/Path: `GET /chat-messages`
- Auth: Bearer
- Description: Message history for one offer thread.
- Sample URL: `{BASE}/chat-messages?item_offer_id=77&page=1`

60. **Send message**
- Method/Path: `POST /send-message`
- Auth: Bearer
- Description: Sends text/audio/file message.
- Content-Type: `multipart/form-data`
- Sample URL: `{BASE}/send-message`
- Sample response:
```json
{
  "error": false,
  "message": "Message sent successfully",
  "data": {
    "id": 1001,
    "item_offer_id": 77,
    "message": "Is price negotiable?",
    "sender_id": 101,
    "created_at": "2026-05-07T06:30:00Z"
  },
  "code": 200
}
```

### I. Verification / Safety

61. `GET /verification-fields` (Bearer)  
Description: Returns required verification schema.  
Sample URL: `{BASE}/verification-fields`

62. `POST /send-verification-request` (Bearer, multipart)  
Description: Submit KYC/verification values and files.  
Sample URL: `{BASE}/send-verification-request`

63. `GET /verification-request` (Bearer)  
Description: Fetch current verification request status.  
Sample URL: `{BASE}/verification-request`

64. `POST /block-user` (Bearer)  
Description: Block a user in chat/safety context.  
Sample URL: `{BASE}/block-user`

65. `POST /unblock-user` (Bearer)  
Description: Unblock blocked user.  
Sample URL: `{BASE}/unblock-user`

66. `GET /blocked-users` (Bearer)  
Description: List blocked users.  
Sample URL: `{BASE}/blocked-users`

### J. Payments / Packages

67. `GET /get-package` (Public + Bearer route exists)
Description: Available package plans.  
Sample URL: `{BASE}/get-package?type=item_listing&platform=android`

68. `POST /assign-free-package` (Bearer)  
Description: Assign free package to account.  
Sample URL: `{BASE}/assign-free-package`

69. `GET /get-payment-settings` (Bearer/Public)  
Description: Enabled payment gateways and settings.  
Sample URL: `{BASE}/get-payment-settings`

70. `POST /payment-intent` (Bearer)  
Description: Create payment intent for package/ad flow.  
Sample URL: `{BASE}/payment-intent`

71. `GET /payment-transactions` (Bearer)  
Description: Payment transaction history.  
Sample URL: `{BASE}/payment-transactions?latest_only=true`

72. `GET /app-payment-status` (Public)  
Description: Payment callback status endpoint.  
Sample URL: `{BASE}/app-payment-status?...`

73. `POST /in-app-purchase` (Bearer)  
Description: Validate Google/Apple purchase token.  
Sample URL: `{BASE}/in-app-purchase`

### K. Motors APIs

74. `GET /search-car-make-model` (Public)  
Description: Search make/model combined endpoint.  
Sample URL: `{BASE}/search-car-make-model?q=toyota&category_slug=used-cars`

75. `GET /get-car-models` (Public)  
Description: Car models search endpoint used by frontend.  
Sample URL: `{BASE}/get-car-models?search=corolla`

76. `GET /car_makes` (Public)  
Description: Car make list.
- Sample URL: `{BASE}/car_makes`

77. `GET /car_models/{car_make_id}` (Public)  
Description: Models by make id.
- Sample URL: `{BASE}/car_models/12`

78. `GET /car_model_trims/{model_id}` (Public)  
Description: Trims by model id.
- Sample URL: `{BASE}/car_model_trims/114`

79. `GET /car_make_models_merged` (Public)  
Description: Merged make-model tree.  
Sample URL: `{BASE}/car_make_models_merged`

80. `POST /car-evaluations` (Bearer)  
Description: Submit car valuation request.
- Sample URL: `{BASE}/car-evaluations`

81. `POST /car-finance` (Bearer)  
Description: Submit car finance request.
- Sample URL: `{BASE}/car-finance`

82. `POST /car-inspection` (Bearer)  
Description: Submit inspection purchase details.
- Sample URL: `{BASE}/car-inspection`

83. `POST /get-car-inspection` (Bearer)  
Description: Fetch inspection entries by user.
- Sample URL: `{BASE}/get-car-inspection`

### L. Blog / FAQ / Tips / Contact

84. `GET /blogs` (Public)  
Description: Blog listing/detail by slug/category/tag.
- Sample URL: `{BASE}/blogs?slug=how-to-sell-fast&sort_by=new-to-old`

85. `GET /blog-tags` (Public)  
Description: Available blog tags.
- Sample URL: `{BASE}/blog-tags`

86. `GET /faq` (Public)  
Description: FAQ entries.
- Sample URL: `{BASE}/faq`

87. `GET /tips` (Public)  
Description: Safety/selling tips.
- Sample URL: `{BASE}/tips`

88. `POST /contact-us` (Public)  
Description: Submit contact form.
- Sample URL: `{BASE}/contact-us`

### M. Geography / Place APIs

89. `GET /countries` (Public)  
Description: Country dropdown values.
- Sample URL: `{BASE}/countries?search=United&page=1`

90. `GET /states` (Public)  
Description: States by country.
- Sample URL: `{BASE}/states?country_id=1&search=Dub&page=1`

91. `GET /cities` (Public)  
Description: Cities by state.
- Sample URL: `{BASE}/cities?state_id=2&search=Sha&page=1`

92. `GET /areas` (Public)  
Description: Areas by city.
- Sample URL: `{BASE}/areas?city_id=3&search=Marina&page=1`

### N. Seller / Public Profile

93. `GET /get-seller` (Public)  
Description: Seller profile, items and ratings.
- Sample URL: `{BASE}/get-seller?id=501&page=1`

94. `POST /get-public-profile-data` (Public, token optionally used by frontend)  
Description: Public profile details by user id.
- Sample URL: `{BASE}/get-public-profile-data`

### O. Jobs / Candidate Dashboard APIs

95. `POST /add-job-application-info` (Bearer)  
Description: Apply to job with candidate details/resume.
- Sample URL: `{BASE}/add-job-application-info`

96. `POST /get-job-application-info` (Bearer)  
Description: Fetch candidate application profile.
- Sample URL: `{BASE}/get-job-application-info`

97. `POST /get-my-job-application` (Bearer)  
Description: Applied jobs list.
- Sample URL: `{BASE}/get-my-job-application`

98. `POST /get-apply-info` (Bearer)  
Description: Candidate apply info for a job and user.
- Sample URL: `{BASE}/get-apply-info`

99. `POST /add-user-detail` (Bearer)  
Description: Save complete job profile (education/experience/skills).
- Sample URL: `{BASE}/add-user-detail`

100. `POST /get-user-detail` (Bearer)  
Description: Fetch user detail profile.
- Sample URL: `{BASE}/get-user-detail`

101. `GET /get-job-dashboard-profile` (Bearer)  
Description: Personal/company recruiter dashboard profile.
- Sample URL: `{BASE}/get-job-dashboard-profile?user_id=101&type=personal`

102. `POST /add-personal-profile` (Bearer)  
Description: Save personal recruiter profile.
- Sample URL: `{BASE}/add-personal-profile`

103. `POST /add-company-profile` (Bearer)  
Description: Save company recruiter profile.
- Sample URL: `{BASE}/add-company-profile`

104. `GET /get-user-rejection-rule` (Bearer)  
Description: Fetch rejection rule settings.
- Sample URL: `{BASE}/get-user-rejection-rule?user_id=101`

105. `POST /user-rejection-rule` (Bearer)  
Description: Save rejection rule settings.
- Sample URL: `{BASE}/user-rejection-rule`

106. `GET /get-candidate-details` (Bearer)  
Description: Candidate pool with paging.
- Sample URL: `{BASE}/get-candidate-details?user_id=101&offset=0&limit=10`

107. `POST /saved-candidate-details` (Bearer)  
Description: Save/unsave candidate detail record.
- Sample URL: `{BASE}/saved-candidate-details`

108. `POST /get-saved-candidate-details` (Bearer)  
Description: Saved candidate details list.
- Sample URL: `{BASE}/get-saved-candidate-details`

109. `POST /get-unsaved-candidate-details` (Bearer)  
Description: Unsaved candidate details list.
- Sample URL: `{BASE}/get-unsaved-candidate-details`

110. `GET /get-candidate-name` (Bearer)  
Description: Candidate name search.
- Sample URL: `{BASE}/get-candidate-name?search=ali`

111. `POST /saved-candidate-name` (Bearer)  
Description: Save candidate name profile.
- Sample URL: `{BASE}/saved-candidate-name`

112. `POST /get-saved-candidate-name` (Bearer)  
Description: Fetch saved candidate names.
- Sample URL: `{BASE}/get-saved-candidate-name`

113. `POST /get-user-address` (Bearer)  
Description: Get user saved addresses.
- Sample URL: `{BASE}/get-user-address`

114. `POST /user-address-changes` (Bearer)  
Description: Add/edit/delete/default address actions.
- Sample URL: `{BASE}/user-address-changes`

### P. OTP / Auxiliary

115. `POST /send-otp` (Public)  
Description: Send OTP to phone number.
- Sample URL: `{BASE}/send-otp`

116. `POST /verify-otp` (Public)  
Description: Verify OTP code.
- Sample URL: `{BASE}/verify-otp`

117. `POST /set-item-total-click` (Public)  
Description: Increment item click/view count.
- Sample URL: `{BASE}/set-item-total-click`

118. `POST /test-message` (Public)  
Description: Internal testing endpoint.
- Sample URL: `{BASE}/test-message`

---

## 4) Common Response Description for List Endpoints

Many list APIs return paginated `data`:

```json
{
  "error": false,
  "message": "Data Fetched Successfully",
  "data": {
    "data": [],
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 0
  },
  "code": 200
}
```

Pagination fields:
- `current_page`: current page number
- `last_page`: total pages
- `per_page`: items per page
- `total`: total item count

---

## 5) Realtime / WebSocket

Frontend WebSocket config (`socket.io-client`):
- URL format: `{WS_BASE}` (from `NEXT_PUBLIC_WS_URL`)
- Fallback: `ws://143.110.251.34:6002`
- Auth payload: `{ token: "Bearer <token>" }`

Backend helper APIs (Bearer):
- `GET /ws/auth`
- `POST /ws/message`
- `GET /ws/can-join`
- `GET /ws/ping`
- `GET /ws/presence`

---

## 6) Important Integration Notes

- Keep exact backend field names (including typos) where already used in frontend, e.g.:
  - `custom_fileds`
  - `currentlt_locate`
  - `experience_job_titel`
  - `lan`
- Most write APIs in frontend use `multipart/form-data` even when payload is simple.
- Boolean-like fields are often sent as `"1"` / `"0"` in multipart flows.
# Mobile App API Documentation

This document is generated from the frontend API client definitions in:
- `src/utils/api.js`
- `src/api/AxiosInterceptors.jsx`
- `src/utils/socket.js`

## Base Configuration

- Base URL: `${NEXT_PUBLIC_API_URL}${NEXT_PUBLIC_END_POINT}`
- Default request headers:
  - `Authorization: Bearer <token>` when user token exists in store
  - `Content-Language: <language_code>` when selected language exists
- Response handling:
  - `401` triggers logout flow and user deactivated alert handling

## Authentication

- Most endpoints work with optional auth from interceptor.
- Endpoints in profile/jobs/dashboard/device/address flows are intended to be authenticated.
- Some methods also add explicit `authorization` header from store token.

## Realtime (Socket)

- URL: `NEXT_PUBLIC_WS_URL` (fallback `ws://143.110.251.34:6002`)
- Transport: websocket
- Auth: `Bearer <token>` in socket auth payload (when available)

---

## Endpoint Catalog

### System / Settings

- `GET /get-system-settings` params: `type`
- `GET /seo-settings`
- `GET /get-slider`
- `GET /get-languages` params: `language_code`, `type`

### Categories / Taxonomy / Search Meta

- `GET /get-categories` params: `category_id`, `page`
- `GET /get-category-children-by-parent` params: `parent_category_id`, `title`, `category_slug`
- `GET /get-category-filters` params: `slug`
- `GET /get-category-tree-by-slug` params: `category_slug`
- `GET /search-car-make-model` params: `q`, `category_slug`
- `GET /search-categories-under-slug` params: `category_slug`, `text`
- `GET /search-job-suggestion` params: `text`
- `GET /search-banner-suggestion` params: `search`, `category_id`, `limit`
- `GET /get-parent-categories` params: `child_category_id`, `tree`, `slug`
- `GET /get-parent-category-list`
- `GET /categoryhome` params: `parent_category_id`, `category-slug`
- `GET /get-customfields` params: `category_ids`
- `GET /get-customfields-by-category-id` params: `category_id`
- `GET /job-roles` params: `category_slug`

### Listings / Items

- `GET /get-item` params include:
  - `id`, `category_id`, `slug`, `category_slug`, `featured_section_id`, `featured_section_slug`
  - `search`, `sort_by`, `status`, `page`, `per_page`, `limit`
  - `min_price`, `max_price`, `posted_since`, `popular_items`
  - location: `country`, `state`, `city`, `area_id`, `latitude`, `longitude`, `radius`
  - property: `purpose`, `area`, `property_type`, `agency`
  - motors: `make_id`, `model_id`, `make_model`
  - user: `user_id`
  - dynamic: all keys from `filterQuery`
- `POST /add-item` multipart:
  - core: `name`, `slug`, `description`, `category_id`, `all_category_ids`, `price`, `contact`
  - media: `image`, `gallery_images[]`, `video_link`, `tour_360_link`
  - location: `address`, `latitude`, `longitude`, `country`, `state`, `city`
  - attributes: `custom_fields` (json), `custom_field_files[...]`
  - motors: `car_make`, `car_model`, `car_trim`
  - property plans: `unit_types[][type|plans...]`
  - `show_only_to_premium`
- `POST /update-item` multipart:
  - `id` plus editable listing fields
  - media updates include `image`, `gallery_images[]`, `delete_item_image_id`
- `POST /delete-item` multipart: `id`
- `POST /update-item-status` multipart: `item_id`, `status`, `sold_to`
- `POST /make-item-featured` multipart: `item_id`, `positions`
- `POST /renew-item` multipart: `item_id`, `package_id`
- `POST /get-similar-product` multipart: `category_id`, `item_id`
- `POST /get-property-plan` multipart: `item_id`
- `GET /my-items` params: `sort_by`, `page`, `per_page`, `status`, `id`, `category_id`, `slug`
- `GET /my-items-count`
- `GET /get-limits` params: `package_type`

### Home / Discovery

- `GET /get-featured-section` params: `city`, `state`, `country`, `slug`, `category_id`, `filter`
- `GET /get-home-categories`
- `GET /get-popular-categories`
- `GET /get-popular-job` params: `category_id`, `city`

### Favorites / Saved Searches

- `POST /manage-favourite` multipart: `item_id`, `favouritelisting_id`
- `GET /get-favourite-item` params: `page`, `favouritelisting_id`
- `POST /get-favourite-listing` multipart: `user_id`
- `POST /favourite-listing` multipart: `user_id`, `listing_id`, `listing_name`, `type`
- `GET /saved-search` params: `page`
- `POST /saved-search` multipart:
  - `title`, `category_slug`, `search_url`, `api_search_url`, `location`
  - flags: `subscribe_email` (`1|0`), `notification` (`1|0`)
- `POST /edit-saved-search` multipart: `id`, `title`
- `POST /delete-saved-search` multipart: `id`

### User / Auth / Profile

- `POST /user-signup` multipart:
  - `name`, `email`, `mobile`, `fcm_id`, `firebase_id`, `type`, `profile`, `country_code`, `registration`, `device_name`
- `POST /update-profile` multipart:
  - `name`, `email`, `mobile`, `fcm_id`, `address`, `profile`, `notification`, `show_personal_details`
- `DELETE /delete-user`
- `GET /get-notification-list` params: `page`
- `GET /get-devices`
- `DELETE /logout-device/{device_id}`
- `POST /set-user-phonenumber` multipart: `user_id`, `phone_number`
- `POST /verification-fields`
- `POST /send-verification-request` multipart:
  - text fields: `verification_field[id]`
  - files: `verification_field_files[id]`
- `GET /verification-request`

### Address Book

- `POST /get-user-address` multipart: `user_id`
- `POST /user-address-changes` multipart:
  - `address_id`, `user_id`, `type`, `neighbourhood`, `street_name`, `apartment_number`, `label`
  - `default`, `lat`, `lan`

### Seller / Reviews / Reports

- `GET /get-seller` params: `id`, `page`
- `POST /item-buyer-list` multipart: `item_id`
- `POST /add-item-review` multipart: `review`, `ratings`, `item_id`
- `GET /my-review` params: `page`
- `GET /get-report-reasons`
- `POST /add-reports` multipart: `item_id`, `report_reason_id`, `other_message`
- `POST /ad-report` multipart: `user_id`, `item_id`, `report_type`, `report_text`, `spam_type`
- `POST /add-review-report` multipart: `seller_review_id`, `report_reason`
- `POST /block-user` multipart: `blocked_user_id`
- `POST /unblock-user` multipart: `blocked_user_id`
- `GET /blocked-users`

### Contact / Content

- `POST /contact-us` multipart: `name`, `email`, `subject`, `message`
- `GET /blogs` params: `slug`, `category_id`, `sort_by`, `tag`
- `GET /blog-tags`
- `GET /faq`
- `GET /tips`

### Geography

- `GET /countries` params: `search`, `page`
- `GET /states` params: `country_id`, `search`, `page`
- `GET /cities` params: `state_id`, `search`, `page`
- `GET /areas` params: `city_id`, `search`, `page`

### Payments / Packages / Promotions

- `GET /get-package` params: `type`
- `POST /assign-free-package` multipart: `package_id`
- `GET /get-payment-settings`
- `POST /payment-intent` multipart:
  - `package_id`, `basePackageRecordId`, `selectedAddonPackageIds` (json string), `item_id`, `payment_method`, `platform_type`
- `GET /payment-transactions`

### Motors Services

- `GET /get-car-models` params: `search`
- `POST /car-evaluations` multipart:
  - `user_id`, `user_name`, `user_number`, `user_email`, `car_name`, `car_make_id`, `car_model_id`, `car_trim_id`, `car_year`
- `POST /car-finance` multipart:
  - `user_id`, `user_name`, `user_number`, `user_email`, `car_name`, `car_make_id`, `car_model_id`, `car_trim_id`, `car_year`
- `POST /car-inspection` multipart:
  - `user_id`, `user_number`, `seller_number`, `package_id`, `price`, `email`, `payment_type`, `payment_status`
- `POST /get-car-inspection` multipart: `user_id`

### Offers / Chat

- `POST /item-offer` multipart: `item_id`, `amount`
- `GET /chat-list` params: `type`, `page`
- `GET /chat-messages` params: `item_offer_id`, `page`
- `POST /send-message` multipart: `item_offer_id`, `message`, `file`, `audio`

### Jobs: Candidate + Recruiter + Profile

- `POST /add-job-application-info` multipart:
  - `item_id`, `user_id`, `full_name`, `email_id`, `nationality`, `phone_no`, `gender`
  - `visa_status`, `education_level`, `total_experience`, `currentlt_locate`, `job_status`, `job_category`
  - `current_company`, `current_position`, `industry`, `notice_period`, `resume`
- `POST /get-job-application-info` multipart: `user_id`
- `POST /get-apply-info` multipart: `user_id`, `item_id`
- `POST /get-my-job-application` multipart: `user_id`
- `POST /get-user-detail` multipart: `user_id`
- `POST /add-user-detail` multipart:
  - personal: `name`, `last_name`, `email_id`, `mobile`, `date_of_birth`, `gender`, `language`, `nationality`, `profile`
  - job: `current_location`, `visa_status`, `career_level`, `desired_salary`, `job_status`, `profile_summary`, `resume`
  - education: `degree`, `specialization`, `university_name`, `country`, `graduation_from`, `graduation_to`, `qualification_id`
  - experience: `fresher`, `experience_id`, `experience_job_titel`, `experience_job_category`, `experience_industry`, `experience_company`, `experience_country`, `experience_job_description`, `experience_start_date`, `experience_end_date`, `currently_working`
  - extras: `skills`, `type`, `licenses_certificates_id`, `course_name`, `issuing_organization`
  - portfolio/ref: `user_portfolio_id`, `portfolio_name`, `portfolio_link`, `user_reference_id`, `reference_name`, `reference_company_name`, `reference_email`
- `GET /get-job-dashboard-profile` params: `user_id`, `type`
- `POST /add-personal-profile` multipart: `user_id`, `personal_name`, `personal_email`, `personal_number`, `city`
- `POST /add-company-profile` multipart:
  - `user_id`, `company_name`, `company_type`, `company_logo`, `city`, `industry`, `license_no`, `company_size`, `description`
  - `contact_name`, `phone_number`, `website`, `youtube`, `email`, `facebook`, `twitter`, `linkedin`, `instagram`
- `GET /get-user-rejection-rule` params: `user_id`
- `POST /user-rejection-rule` multipart:
  - `user_id`, `local_candidate`, `screening_question`, `experience`, `minimum_education`, `gender`, `nationality`
- `GET /get-candidate-details` params: `user_id`, `offset`, `limit`
- `POST /saved-candidate-details` multipart: `user_id`, `job_info_id`, `item_id`, `type`
- `POST /get-saved-candidate-details` multipart: `user_id`, `offset`, `limit`
- `POST /get-unsaved-candidate-details` multipart: `user_id`, `offset`, `limit`
- `GET /get-candidate-name` params: `search`
- `POST /saved-candidate-name` multipart: `user_id`, `job_info_id`, `full_name`, `type`, `saved_search_id`
- `POST /get-saved-candidate-name` multipart: `user_id`
- `POST /get-public-profile-data` multipart: `user_id`

---

## Request Content Types

- Most create/update actions use `multipart/form-data`.
- Most list/fetch actions use `GET` with query params.

## Notes for Mobile Integration

- Maintain same field names (including backend typos like `custom_fileds`, `currentlt_locate`, `experience_job_titel`, `lan`) to avoid request rejection.
- For booleans sent via multipart, this client often converts to `"1"` / `"0"` string.
- Saved-search API path format is generated as `get-item?...` (without host), then passed as `api_search_url`.
