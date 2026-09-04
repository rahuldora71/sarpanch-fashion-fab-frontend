export const ADDON_PAGE_SIZE = 10;

export const ADDON_DEFAULT_SORT =
  "name,asc";

export const ADDON_IMAGE = {
  aspect: 1,
  maxSizeMB: 5,
} as const;

export const ADDON_MESSAGES = {
  nameRequired:
    "Add-on name is required.",

  invalidPrice:
    "Please enter a valid price.",

  invalidTailorCommission:
    "Please enter a valid tailor commission.",

  createSuccess:
    "Add-on created successfully",

  updateSuccess:
    "Add-on updated successfully",

  createError:
    "Failed to create add-on. Please try again.",

  updateError:
    "Failed to update add-on. Please try again.",

  loadError:
    "Failed to load add-on.",

  uploadLabel:
    "Add-on image",

  beforeCuttingTitle:
    "Before cutting",

  beforeCuttingDescription:
    "Apply this add-on before the cutting stage.",

  activeTitle:
    "Active",

  activeDescription:
    "Active add-ons can be selected for orders.",
} as const;