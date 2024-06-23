export interface Country {
    _id: string;
    name: string;
    iso3: string;
    iso2: string;
    prefix: string;
    capital: string;
    currency: string;
    currency_symbol: string;
    native: string;
    region: string;
    subregion: string;
    divGeo: string;
    address_format: number;
    timezones: Array<{
        zoneName: string;
        gmtOffset: number;
        gmtOffsetName: string;
        abbreviation: string;
        tzName: string;
    }>;
    translations: { [key: string]: string };
    latitude: string;
    longitude: string;
    emoji: string;
    emojiU: string;
}
