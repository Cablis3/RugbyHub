import { Club } from '../types';

// Seed data — zdroj: www.rugbyunion.cz/kluby (ručně ověřeno)
// Pro aktualizaci spusť: npx ts-node scripts/scrapeClubs.ts
export const czechRugbyClubs: Club[] = [
  // Praha
  { id: 'club-01', name: 'RC Praga Praha',         city: 'Praha',                   website: 'https://rcpraga.cz',         rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rc-praga-praha' },
  { id: 'club-02', name: 'RC Slavia Praha',         city: 'Praha',                                                          rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rc-slavia-praha' },
  { id: 'club-03', name: 'RC Sparta Praha',         city: 'Praha',                   website: 'https://rugbysparta.cz',     rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rc-sparta-praha' },
  { id: 'club-04', name: 'RK Petrovice',            city: 'Praha',                                                          rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rk-petrovice' },
  { id: 'club-05', name: 'RC Tatra Smíchov',        city: 'Praha',                                                          rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rc-tatra-smichov' },
  { id: 'club-06', name: 'ARC Iuridica',            city: 'Praha',                                                          rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/arc-iuridica' },
  { id: 'club-07', name: 'RC Dragons Praha',        city: 'Praha',                                                          rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rc-dragons-praha' },
  // Středočeský kraj
  { id: 'club-08', name: 'RC Mountfield Říčany',    city: 'Říčany',                  website: 'https://rcricany.cz',        rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rc-mountfield-ricany' },
  // Jihomoravský kraj
  { id: 'club-09', name: 'RA Brno',                 city: 'Brno',                                                           rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/ra-brno' },
  { id: 'club-10', name: 'RC Ducks Brno',           city: 'Brno',                                                           rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rc-ducks-brno' },
  { id: 'club-11', name: 'RK Kuřim',                city: 'Kuřim',                                                          rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rk-kurim' },
  // Moravskoslezský kraj
  { id: 'club-12', name: 'TJ Sokol Mariánské Hory', city: 'Ostrava',                                                        rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/tj-sokol-marianske-hory' },
  // Vysočina
  { id: 'club-13', name: 'RK Vrchovina',            city: 'Nové Město na Moravě',                                           rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rk-vrchovina' },
  { id: 'club-14', name: 'RC Havlíčkův Brod',       city: 'Havlíčkův Brod',                                                 rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rc-havlickuv-brod' },
  // Jihočeský kraj
  { id: 'club-15', name: 'Strakonice RFC',           city: 'Strakonice',                                                     rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/strakonice-rfc' },
  // Plzeňský kraj
  { id: 'club-16', name: 'Rugby Club Plzeň',        city: 'Plzeň',                                                          rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rugby-club-plzen' },
  // Olomoucký kraj
  { id: 'club-17', name: 'Přerov RFC',              city: 'Přerov',                                                         rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/prerov-rfc' },
  // Liberecký kraj
  { id: 'club-18', name: 'RC Lomnice nad Popelkou', city: 'Lomnice nad Popelkou',                                            rugbyUnionUrl: 'https://www.rugbyunion.cz/kluby/rc-lomnice-nad-popelkou' },
];
