import { countries } from "./countries";

export interface CountryOption {
  label: string;
  value: string;
  flag: string;
}

// 🔥 ISO mapping (only needed for flag generation)
const countryCodeMap: Record<string, string> = {
  Afghanistan: "AF",
  Albania: "AL",
  Algeria: "DZ",
  Andorra: "AD",
  Angola: "AO",
  Argentina: "AR",
  Armenia: "AM",
  Australia: "AU",
  Austria: "AT",
  Azerbaijan: "AZ",
  Bangladesh: "BD",
  Belgium: "BE",
  Brazil: "BR",
  Canada: "CA",
  China: "CN",
  Egypt: "EG",
  Ethiopia: "ET",
  France: "FR",
  Germany: "DE",
  Ghana: "GH",
  India: "IN",
  Indonesia: "ID",
  Iran: "IR",
  Iraq: "IQ",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  Japan: "JP",
  Kenya: "KE",
  Malaysia: "MY",
  Mexico: "MX",
  Morocco: "MA",
  Netherlands: "NL",
  NewZealand: "NZ",
  Nigeria: "NG",
  Norway: "NO",
  Pakistan: "PK",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  Qatar: "QA",
  Romania: "RO",
  Russia: "RU",
  SaudiArabia: "SA",
  Singapore: "SG",
  SouthAfrica: "ZA",
  SouthKorea: "KR",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Thailand: "TH",
  Turkey: "TR",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  "United States": "US",
  Vietnam: "VN",
  Zambia: "ZM",
  Zimbabwe: "ZW",
};

// 🔥 FLAG GENERATOR (AUTO)
function getFlag(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0))
    .map((n) => String.fromCodePoint(n))
    .join("");
}

// 🔥 BUILD OPTIONS
export const countryOptions: CountryOption[] = countries.map((country) => {
  const code = countryCodeMap[country] || "UN"; // fallback

  return {
    label: country,
    value: country,
    flag: getFlag(code),
  };
});