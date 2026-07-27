export type Food = {
  id: number;
  name: string;
  category: string;
  origin: string;
  method: string;
  instructions: string;
  ingredients: string[];
};

export const demoFoods: Food[] = [
  {
    id: 1,
    name: "Chicken Adobo",
    category: "Main Dish",
    origin: "Nationwide",
    method: "Braising",
    instructions:
      "Braise chicken with vinegar, soy sauce, garlic, pepper, and bay leaf until tender and glossy.",
    ingredients: [
      "Chicken",
      "Soy sauce",
      "Cane vinegar",
      "Garlic",
      "Bay leaf",
      "Black pepper",
    ],
  },
  {
    id: 2,
    name: "Pork Sinigang",
    category: "Soup",
    origin: "Nationwide",
    method: "Simmering",
    instructions:
      "Simmer pork until tender, add vegetables, then season the broth with tamarind.",
    ingredients: [
      "Pork",
      "Tamarind",
      "Tomato",
      "Onion",
      "Eggplant",
      "String beans",
    ],
  },
  {
    id: 3,
    name: "Kare-Kare",
    category: "Main Dish",
    origin: "Pampanga",
    method: "Stewing",
    instructions:
      "Stew beef until tender and finish with a savory peanut sauce and blanched vegetables.",
    ingredients: [
      "Beef",
      "Peanut sauce",
      "Eggplant",
      "String beans",
      "Shrimp paste",
    ],
  },
  {
    id: 4,
    name: "Laing",
    category: "Vegetable Dish",
    origin: "Bicol",
    method: "Slow cooking",
    instructions:
      "Slow-cook dried taro leaves in coconut milk with aromatics and chili.",
    ingredients: [
      "Taro leaves",
      "Coconut milk",
      "Chili pepper",
      "Garlic",
    ],
  },
  {
    id: 5,
    name: "Chicken Inasal",
    category: "Main Dish",
    origin: "Western Visayas",
    method: "Grilling",
    instructions:
      "Marinate chicken in calamansi, vinegar, and aromatics, then grill over charcoal.",
    ingredients: ["Chicken", "Calamansi", "Cane vinegar", "Garlic"],
  },
  {
    id: 6,
    name: "Halo-Halo",
    category: "Dessert",
    origin: "Nationwide",
    method: "Assembly",
    instructions:
      "Layer sweetened fruits and beans with shaved ice, milk, and purple yam.",
    ingredients: ["Jackfruit", "Shaved ice", "Purple yam", "Milk"],
  },
];

