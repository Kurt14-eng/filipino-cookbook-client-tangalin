# Sarap Atlas - Filipino Cookbook Client

Sarap Atlas is a responsive web client that consumes a classmate-developed Filipino Cookbook API. It turns JSON food records into searchable recipe cards and readable detail views without connecting directly to the API database.

## Application Features

- Responsive Filipino cookbook interface for desktop and mobile.
- Food search by dish name or ingredient.
- Category and origin filters.
- Random dish selection.
- Detailed ingredient and preparation views.
- Live API status and understandable connection errors.
- Runtime API base URL, bearer-token, developer, and repository configuration.
- Bearer token kept only in memory for the current browser tab.
- Demo preview for interface review before the selected API is running.
- Visible acknowledgment of the selected API developer.
- Compatibility with both `{ "status": "success", "data": [...] }` responses and APIs that return arrays directly.

## Technologies Used

- TypeScript
- React 19
- Next.js 16
- vinext and Vite
- HTML and CSS
- Fetch API
- Node.js
- Git and GitHub

## API Source and Acknowledgment

This client must be finalized with a Filipino Cookbook API developed by a classmate.

- Developer: **[NAME OF SELECTED CLASSMATE]**
- GitHub username: **[CLASSMATE GITHUB USERNAME]**
- API repository: **[CLASSMATE API REPOSITORY URL]**
- API base URL: **[CLASSMATE API BASE URL]**
- Authentication: **Bearer token**

The API is used for educational purposes with the permission of the developer. Replace the bracketed fields before submission. The same developer name and repository URL can be entered in the application’s **API setup** panel.

## Endpoints Used

Required:

- `GET /api/foods` - loads all food cards.
- `GET /api/foods/{id}` - loads complete information for a selected dish.

Used when the selected API provides the optional enhancements:

- `GET /api/foods/random` - selects a random dish.
- `GET /api/foods/{id}/ingredients` - supplements a detail response that has no ingredient list.

The client performs category, origin, and free-text filtering on the food list already retrieved from the API. If the optional detail/random endpoints are unavailable, it falls back gracefully to the loaded list data.

## Installation

1. Clone the client repository.

   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/filipino-cookbook-client-YOUR_SURNAME.git
   cd filipino-cookbook-client-YOUR_SURNAME
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Optionally copy `.env.example` to `.env.local` and set the non-secret defaults.
4. Start the development server.

   ```bash
   npm run dev
   ```

5. Open the local URL printed by the development server.
6. Select **API setup** and enter:
   - the classmate API base URL,
   - the bearer token,
   - the API developer’s name, and
   - the classmate repository URL.
7. Select **Test and connect**.

## Configuration

The API base URL, developer name, and repository URL may be supplied as public build-time defaults:

```text
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_API_DEVELOPER
NEXT_PUBLIC_API_REPOSITORY
```

Do not place the bearer token in `.env`, source code, a public build variable, or GitHub. Enter it in the API setup panel at runtime. The application never writes the token to `sessionStorage`; only the non-secret source details are remembered for the current tab.

## API Response Compatibility

The client accepts a successful response shaped like:

```json
{
  "status": "success",
  "data": [
    {
      "food_id": 1,
      "food_name": "Chicken Adobo",
      "category_name": "Main Dish",
      "origin_name": "Nationwide",
      "instructions": "Braise until tender.",
      "ingredients": ["Chicken", "Vinegar", "Soy sauce"]
    }
  ]
}
```

It also accepts a raw array and common alternate names such as `id`, `name`, `category`, and `origin`.

## Testing

Run the production build and rendered-interface checks:

```bash
npm test
```

For the final integration test:

1. Run the selected classmate API.
2. Confirm its CORS configuration allows the client origin.
3. Connect with a valid token.
4. Verify the food list, search/filter controls, random button, and recipe modal.
5. Try a missing/invalid token and confirm an understandable error is shown.
6. Confirm that no raw JSON is presented as the final interface.

## Screenshots

- `screenshots/main-interface.png` - main cookbook interface with processed food cards.
- `screenshots/recipe-detail.png` - selected recipe with ingredients and instructions.
- `screenshots/api-setup.png` - runtime API configuration panel without a real token.

## Developer Information

- Student: **[YOUR FULL NAME]**
- Course and section: **[YOUR COURSE AND SECTION]**
- GitHub username: **[YOUR GITHUB USERNAME]**
- Client repository: **https://github.com/YOUR_GITHUB_USERNAME/filipino-cookbook-client-YOUR_SURNAME**
- Date completed: **2026-07-27**

