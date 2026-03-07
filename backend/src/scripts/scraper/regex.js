export const facebookRegex = new RegExp(
  /((http|https):\/\/|)(www\.|)facebook\.com\/[a-zA-Z0-9.]{1,}/g
);
export const instagramRegex = new RegExp(
  /(https?:\/\/)?(www\.)?instagram\.com\/[A-Za-z0-9_.]{1,30}\/?/g
);
export const twitterRegex = new RegExp(
  /(https?:\/\/)?(www\.)?twitter\.com\/[A-Za-z0-9_]{5,15}(\?(\w+=\w+&?)*)?/g
);
export const linkedinRegex = new RegExp(
  /[(https:\/\/www\.linkedin.com)]{20}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)+/g
);
export const phoneRegex = new RegExp(
  /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/g
);
export const emailRegex = new RegExp(
  /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi
);

export const metaAllRegex = new RegExp(
  /<[\s]*meta[\s]*name[\s]*=[\s]*["\']?([^>"\']*)["\']?[\s]*content[\s]*=[\s]*["\']?([^>"\']*)["\']?[\s]*[\/]?[\s]*>/gi
);
