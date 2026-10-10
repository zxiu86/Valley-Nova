export interface RiwaqEpicItem {
  id: string;
  title: string;
  author?: string;
  category?: string;
  coverImage: string;
  quote?: string;
  badge?: string;
  alley?: string;
  description?: string;
}

export const SPOTLIGHT_EPIC: RiwaqEpicItem = {
  id: 'novel-gilgamesh',
  title: 'ملحمة جلجامش الخالدة',
  author: 'ألواح سومر وبابل القديمة',
  category: 'ملاحم الشرق القديم',
  badge: 'تاج الملاحم الإنسانية الأولى',
  quote: '“هو الذي رأى كل شيء فبلغت به الحكمة أقاصي الأرض، وعاد يروي ما كان قبل الطوفان العظيم، ونقش على حجر الصوان كل متاعبه.”',
  coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXguqalKAYo_emgzQ4kIArKbg3u4gvKSf-L_tzqdpDfi8ZqGq69wG98l5bl_Xe1BQ1oLv3c_YAD_32EBhNv3yE7Rm4fd6ZtVOxip5leVRsvg54h0EMqUrlJ4m7VWY96QLZjdKG9RYamxH34-tCNzXkn9xceCUUlzxzs_HH6t8QF8efkUrzRj47ZtvoR8wHRyw52_qWqNR9XHz31l5avMe3ABcnnf0UDBHbZk12K9yDWF5YHQxIJIhbgA',
  description: 'رحلة ملك أوروك العظيم في البحث عن سر الخلود وفجيعته بفقدان رفيقه إنكيدو؛ سفر الأسئلة الأزلية التي تواجه الإنسان أمام حتمية الفناء وقهر الزمان.'
};

export const FEATURED_EPICS: RiwaqEpicItem[] = [
  {
    id: 'novel-gilgamesh',
    title: 'جلجامش',
    author: 'ألواح بابل وسومر',
    category: 'ملاحم الشرق القديم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXguqalKAYo_emgzQ4kIArKbg3u4gvKSf-L_tzqdpDfi8ZqGq69wG98l5bl_Xe1BQ1oLv3c_YAD_32EBhNv3yE7Rm4fd6ZtVOxip5leVRsvg54h0EMqUrlJ4m7VWY96QLZjdKG9RYamxH34-tCNzXkn9xceCUUlzxzs_HH6t8QF8efkUrzRj47ZtvoR8wHRyw52_qWqNR9XHz31l5avMe3ABcnnf0UDBHbZk12K9yDWF5YHQxIJIhbgA',
  },
  {
    id: 'novel-iliad',
    title: 'الإلياذة',
    author: 'هوميروس',
    category: 'الملاحم الإغريقية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_eWH_vnKjkYnn6XabpS4W11Vahzp-NBfKHif24pATSicq5IuWuBouWSpSYIfVuKlktkscHojwVyWPpui1oH5R2rkaEhTjiylYVuEHFmDGGKDwAohOpzIzbqokdNcSTkE173lzKVwJoCrPCRmCTf16OChO13EyhGdY1wjgx7uos6zzpXxNxmGpcFTKTAnASnjMsoCFkkT_VxWzNlTkL_WJToJ8GwIoEjojPIVRL7Cx_4f6eLg22QsPLw',
  },
  {
    id: 'novel-odyssey',
    title: 'الأوديسة',
    author: 'هوميروس',
    category: 'الملاحم الإغريقية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDdhqc3I7gyCxIu2Zf6NduqtEQWE1etB38c8EY_J5-jMQnJzDzO7BzGMLFnZ-ip1NSUgMVOtisScbGQ04qYkzwsa4oUZAepemoPxUtRtxf--Hw1D_nfAs66nAU594mLUjgimne6Eu7yc8tb7j1tyfypiO__DtAoXpnMunN8H6i-XKxc6SSzeMHV8n6U3gmywovVLqniRnBxeJYF91Q96eWB3_7GXVrBtXjdMsG5K89sX25PBklhmHihw',
  },
  {
    id: 'novel-shahnameh',
    title: 'الشاهنامة',
    author: 'أبو القاسم الفردوسي',
    category: 'شواهين الشرق والفرس',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMcfQadJaQZBmK4_QLfMcHGTkIjH0eDnJZ4NhrJ5T44Ihr4Hetsgqyw9uU7SmGWwbV9hFdGzGKUmjIkel4RhGQu8-t4TSi_BYFClqNEuvpXhlsOfrunWEabsTy1aqozBcMF-D_RpreNJn28IGheRLN-XwsanBWuJlKtG9Ddk9v-wdWQFnH6q4ZH86rZYzRsWu7RGqKzbLljbCwD9m50kpHVvhlRoXEtVyFzgZpyvG2ajxIRncqQaCvDA',
  },
  {
    id: 'novel-antarah',
    title: 'سيرة عنترة بن شداد',
    author: 'تراث الفروسية العربية',
    category: 'السير الشعبية العربية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCethOeRiCH5aVUzklgBRZoRvhplRvmSGpKr23Sj5gX6tZ8dXHbVCbLOyQYfnA71A-zCiHvrJeU3eiHSbIh7FlL8T_U_s6S4IaFEZqAflkN4w-NqJhj7lYjHuMEwuu3beZLq7LDccfe6O1t-5QRTxk96boY3xN03MYN6354XH8tn2wtSLV85rItgMouRY04HcxUzj2PLY49hlYVjfSRPfzn058OiUliDOsdy89WjrLWpsYLAz4LZZaTaQ',
  },
  {
    id: 'novel-beowulf',
    title: 'ملحمة بيوولف',
    author: 'الشعر الأنجلوساكسوني القديم',
    category: 'ملاحم الشمال والنورس',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7bQQwdHmrNSykeAh09a8gd9gxT7lxsvjw-99P4myZG5CUgvA_C7rbatvO222PAr_DGpDPpzS9JkcLXFiwAq2veb9HtgZNvq302k48CAzD8y1bzgYu49TqCr9YOaAUYRPdK9YjqZ1uISMfq60m_kSw9P9WOmJojl_jFdOPDsTiBvcISTi2x7lvcR0oRwSkH6x03gPJ7JKEDwsSo5mW0QkzK6qWgjZ4yjwAjZWtrJYB17yYSvREC5vbg',
  },
  {
    id: 'novel-aeneid',
    title: 'الإنيادة',
    author: 'فيرجيل',
    category: 'الملاحم الرومانية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEDU8hDbplJHvSM0C3kDXuyto9P2iUzBk32XduT5MAP6ukg073RnCJ8WJHXazfVzq31jzh4CiFs_ieEKfkGh4o0yqK0yGrNqmegx20S_eA774X7AsKC5HvHAaqDlJbrcA7m1mvpaGmmHZ14YWsJsJibtbdJ6UOMl-9U8yfUi7JP7mMdo7--AbT7eeDiOwxFxFfo3iFhWYfjBMjghvjxze8rYlZ8XkZGfzAuQ8n2fACdpVnP77El11yQ',
  },
  {
    id: 'novel-mahabharata',
    title: 'المهابهاراتا',
    author: 'الحكيم فياسا',
    category: 'ملاحم آسيا وأسفار الهند',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmht4M8dhW4qouOfD-vV41r8nv1IJNs9vpPPJidZ09Pz1VQtE19aGDuO_lsdBHQvqzjVq8Iu1US-gi58QaTG-i6dNRDKv-m-HqSa0tYNs_85eaxWzKfhv0dUINk0GpA77khIg2Ih_OmE4Gul_5cAfsemzeGQuFN_qGC740JK4TxnXTUTXHCgvQbYQfL-PL86oIqzHbZwut5yDcd8zrvgbJFOxCbibFroAgaQikOSoPZ2D3srSxO4fC8g',
  },
  {
    id: 'novel-taghriba-hilaliyya',
    title: 'تغريبة بني هلال',
    author: 'الرواية الشفاهية الكبرى',
    category: 'السير الشعبية العربية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL6AlFLOCu4V_rTCVnxJH8vW5nMl7S3_YByn9RxrhO8N7Huv9KmHVqELO-8uri2TlyEM2wvm2UjndTWpxPF9FdCKvAGjEmVvO0L_eG2nO4D841zgSOGdKrmlyOVO-7tD88arZBBuFWBNJRZCfDMxF-fcyJvxYb-lMJu95l4hjELZHU7TGEPFkHadm3oL5Vi87SuUJv9_cAqz7cxYJMj9a36Wddjs1V1k2tUB-DXG5_7HFVpgSVqzbjeg',
  },
  {
    id: 'novel-song-of-roland',
    title: 'نشيد رولاند',
    author: 'فروسية القرون الوسطى',
    category: 'ملاحم العصور الوسطى',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn0Ka2wBsfst8r95rpEeUPrlD2Su41SnFQ-lvZumRa4HICtcom_o39R1ZlreBZSjPm42qkW1YQj7nG_aRIOuLtQmKnJ7Pgsvi6i3T71JjFg8vGhFXIQeLB5zyiZ8fhHdDIZyM0g7JDTZlbi6-GDYAKPONJ6_oxqAj0nZ9diB5zml5gPsIrfHF8jATEJmdlXI3EzSb0TgqVkVmC6OSsczvi-W0lO_rdBrjqvFzYkKGOkeoV9S2823e4zg',
  },
];

// 1. ملاحم الشرق القديم وما بين النهرين
export const MESOPOTAMIAN_EPICS: RiwaqEpicItem[] = [
  {
    id: 'novel-gilgamesh',
    title: 'جلجامش',
    author: 'ألواح بابل وسومر',
    category: 'ملاحم الشرق القديم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXguqalKAYo_emgzQ4kIArKbg3u4gvKSf-L_tzqdpDfi8ZqGq69wG98l5bl_Xe1BQ1oLv3c_YAD_32EBhNv3yE7Rm4fd6ZtVOxip5leVRsvg54h0EMqUrlJ4m7VWY96QLZjdKG9RYamxH34-tCNzXkn9xceCUUlzxzs_HH6t8QF8efkUrzRj47ZtvoR8wHRyw52_qWqNR9XHz31l5avMe3ABcnnf0UDBHbZk12K9yDWF5YHQxIJIhbgA',
  },
  {
    id: 'novel-enuma-elish',
    title: 'إنوما إيليش',
    author: 'ألواح التكوين البابلية',
    category: 'ملاحم الشرق القديم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDdhqc3I7gyCxIu2Zf6NduqtEQWE1etB38c8EY_J5-jMQnJzDzO7BzGMLFnZ-ip1NSUgMVOtisScbGQ04qYkzwsa4oUZAepemoPxUtRtxf--Hw1D_nfAs66nAU594mLUjgimne6Eu7yc8tb7j1tyfypiO__DtAoXpnMunN8H6i-XKxc6SSzeMHV8n6U3gmywovVLqniRnBxeJYF91Q96eWB3_7GXVrBtXjdMsG5K89sX25PBklhmHihw',
  },
  {
    id: 'novel-atrahasis',
    title: 'أسطورة أتراخاسيس',
    author: 'ألواح الطوفان الأكادية',
    category: 'ملاحم الشرق القديم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMcfQadJaQZBmK4_QLfMcHGTkIjH0eDnJZ4NhrJ5T44Ihr4Hetsgqyw9uU7SmGWwbV9hFdGzGKUmjIkel4RhGQu8-t4TSi_BYFClqNEuvpXhlsOfrunWEabsTy1aqozBcMF-D_RpreNJn28IGheRLN-XwsanBWuJlKtG9Ddk9v-wdWQFnH6q4ZH86rZYzRsWu7RGqKzbLljbCwD9m50kpHVvhlRoXEtVyFzgZpyvG2ajxIRncqQaCvDA',
  },
  {
    id: 'novel-inanna-descent',
    title: 'هبوط إنانا',
    author: 'أناشيد سومر المقدسة',
    category: 'ملاحم الشرق القديم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEDU8hDbplJHvSM0C3kDXuyto9P2iUzBk32XduT5MAP6ukg073RnCJ8WJHXazfVzq31jzh4CiFs_ieEKfkGh4o0yqK0yGrNqmegx20S_eA774X7AsKC5HvHAaqDlJbrcA7m1mvpaGmmHZ14YWsJsJibtbdJ6UOMl-9U8yfUi7JP7mMdo7--AbT7eeDiOwxFxFfo3iFhWYfjBMjghvjxze8rYlZ8XkZGfzAuQ8n2fACdpVnP77El11yQ',
  },
  {
    id: 'novel-etana-eagle',
    title: 'أسطورة إيتانا والنسر',
    author: 'مخطوطات كيش القديمة',
    category: 'ملاحم الشرق القديم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7bQQwdHmrNSykeAh09a8gd9gxT7lxsvjw-99P4myZG5CUgvA_C7rbatvO222PAr_DGpDPpzS9JkcLXFiwAq2veb9HtgZNvq302k48CAzD8y1bzgYu49TqCr9YOaAUYRPdK9YjqZ1uISMfq60m_kSw9P9WOmJojl_jFdOPDsTiBvcISTi2x7lvcR0oRwSkH6x03gPJ7JKEDwsSo5mW0QkzK6qWgjZ4yjwAjZWtrJYB17yYSvREC5vbg',
  },
  {
    id: 'novel-kirta-epic',
    title: 'ملحمة كيرات الكنعانية',
    author: 'ألواح أوغاريت ورأس شمرا',
    category: 'ملاحم الشرق القديم',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL6AlFLOCu4V_rTCVnxJH8vW5nMl7S3_YByn9RxrhO8N7Huv9KmHVqELO-8uri2TlyEM2wvm2UjndTWpxPF9FdCKvAGjEmVvO0L_eG2nO4D841zgSOGdKrmlyOVO-7tD88arZBBuFWBNJRZCfDMxF-fcyJvxYb-lMJu95l4hjELZHU7TGEPFkHadm3oL5Vi87SuUJv9_cAqz7cxYJMj9a36Wddjs1V1k2tUB-DXG5_7HFVpgSVqzbjeg',
  },
];

// 2. الملاحم الإغريقية والرومانية الكلاسيكية
export const GREEK_ROMAN_EPICS: RiwaqEpicItem[] = [
  {
    id: 'novel-iliad',
    title: 'الإلياذة',
    author: 'هوميروس',
    category: 'الملاحم الإغريقية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_eWH_vnKjkYnn6XabpS4W11Vahzp-NBfKHif24pATSicq5IuWuBouWSpSYIfVuKlktkscHojwVyWPpui1oH5R2rkaEhTjiylYVuEHFmDGGKDwAohOpzIzbqokdNcSTkE173lzKVwJoCrPCRmCTf16OChO13EyhGdY1wjgx7uos6zzpXxNxmGpcFTKTAnASnjMsoCFkkT_VxWzNlTkL_WJToJ8GwIoEjojPIVRL7Cx_4f6eLg22QsPLw',
  },
  {
    id: 'novel-odyssey',
    title: 'الأوديسة',
    author: 'هوميروس',
    category: 'الملاحم الإغريقية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDdhqc3I7gyCxIu2Zf6NduqtEQWE1etB38c8EY_J5-jMQnJzDzO7BzGMLFnZ-ip1NSUgMVOtisScbGQ04qYkzwsa4oUZAepemoPxUtRtxf--Hw1D_nfAs66nAU594mLUjgimne6Eu7yc8tb7j1tyfypiO__DtAoXpnMunN8H6i-XKxc6SSzeMHV8n6U3gmywovVLqniRnBxeJYF91Q96eWB3_7GXVrBtXjdMsG5K89sX25PBklhmHihw',
  },
  {
    id: 'novel-aeneid',
    title: 'الإنيادة',
    author: 'فيرجيل',
    category: 'الملاحم الرومانية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEDU8hDbplJHvSM0C3kDXuyto9P2iUzBk32XduT5MAP6ukg073RnCJ8WJHXazfVzq31jzh4CiFs_ieEKfkGh4o0yqK0yGrNqmegx20S_eA774X7AsKC5HvHAaqDlJbrcA7m1mvpaGmmHZ14YWsJsJibtbdJ6UOMl-9U8yfUi7JP7mMdo7--AbT7eeDiOwxFxFfo3iFhWYfjBMjghvjxze8rYlZ8XkZGfzAuQ8n2fACdpVnP77El11yQ',
  },
  {
    id: 'novel-metamorphoses',
    title: 'مسخ الكائنات',
    author: 'أوفيد',
    category: 'الملاحم الرومانية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARZemoP3pTK24UmnbmN4sDC1yZRwRAEt9lB1d41vDz1Dr0n-IeNhyoGcSxhSHsa96uewop6Iu7ZTevPXEEzojwmTl1aOHXvfn6FDRy2XlKUi_LSCF5SBjkuyw5605QE-yhe0x77f-ewnp8XfXYXP-pKMgq983vtQOu0Vd9DofT4A_YI4aM601o30WRg-XK06Jhjlg787v01jtz2LNlJ5gc4ahpM9cAn7_lcNE7gTltZOgNnbRzqbol8A',
  },
  {
    id: 'novel-theogony',
    title: 'الثيوغونيا (أنساب الآلهة)',
    author: 'هسيود',
    category: 'الملاحم الإغريقية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn0Ka2wBsfst8r95rpEeUPrlD2Su41SnFQ-lvZumRa4HICtcom_o39R1ZlreBZSjPm42qkW1YQj7nG_aRIOuLtQmKnJ7Pgsvi6i3T71JjFg8vGhFXIQeLB5zyiZ8fhHdDIZyM0g7JDTZlbi6-GDYAKPONJ6_oxqAj0nZ9diB5zml5gPsIrfHF8jATEJmdlXI3EzSb0TgqVkVmC6OSsczvi-W0lO_rdBrjqvFzYkKGOkeoV9S2823e4zg',
  },
  {
    id: 'novel-argonautica',
    title: 'الأرجوناوتيكا',
    author: 'أبولونيوس الرودسي',
    category: 'الملاحم الإغريقية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL6AlFLOCu4V_rTCVnxJH8vW5nMl7S3_YByn9RxrhO8N7Huv9KmHVqELO-8uri2TlyEM2wvm2UjndTWpxPF9FdCKvAGjEmVvO0L_eG2nO4D841zgSOGdKrmlyOVO-7tD88arZBBuFWBNJRZCfDMxF-fcyJvxYb-lMJu95l4hjELZHU7TGEPFkHadm3oL5Vi87SuUJv9_cAqz7cxYJMj9a36Wddjs1V1k2tUB-DXG5_7HFVpgSVqzbjeg',
  },
];

// 3. السير الشعبية والفروسية العربية الخالدة
export const ARABIC_CHIVALRY_EPICS: RiwaqEpicItem[] = [
  {
    id: 'novel-antarah',
    title: 'سيرة عنترة بن شداد',
    author: 'تراث الفروسية العربية',
    category: 'السير الشعبية العربية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCethOeRiCH5aVUzklgBRZoRvhplRvmSGpKr23Sj5gX6tZ8dXHbVCbLOyQYfnA71A-zCiHvrJeU3eiHSbIh7FlL8T_U_s6S4IaFEZqAflkN4w-NqJhj7lYjHuMEwuu3beZLq7LDccfe6O1t-5QRTxk96boY3xN03MYN6354XH8tn2wtSLV85rItgMouRY04HcxUzj2PLY49hlYVjfSRPfzn058OiUliDOsdy89WjrLWpsYLAz4LZZaTaQ',
  },
  {
    id: 'novel-taghriba-hilaliyya',
    title: 'تغريبة بني هلال',
    author: 'الرواية الشفاهية الكبرى',
    category: 'السير الشعبية العربية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL6AlFLOCu4V_rTCVnxJH8vW5nMl7S3_YByn9RxrhO8N7Huv9KmHVqELO-8uri2TlyEM2wvm2UjndTWpxPF9FdCKvAGjEmVvO0L_eG2nO4D841zgSOGdKrmlyOVO-7tD88arZBBuFWBNJRZCfDMxF-fcyJvxYb-lMJu95l4hjELZHU7TGEPFkHadm3oL5Vi87SuUJv9_cAqz7cxYJMj9a36Wddjs1V1k2tUB-DXG5_7HFVpgSVqzbjeg',
  },
  {
    id: 'novel-sayf-dhi-yazan',
    title: 'سيرة سيف بن ذي يزن',
    author: 'أساطير حِمْيَر واليمن',
    category: 'السير الشعبية العربية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXguqalKAYo_emgzQ4kIArKbg3u4gvKSf-L_tzqdpDfi8ZqGq69wG98l5bl_Xe1BQ1oLv3c_YAD_32EBhNv3yE7Rm4fd6ZtVOxip5leVRsvg54h0EMqUrlJ4m7VWY96QLZjdKG9RYamxH34-tCNzXkn9xceCUUlzxzs_HH6t8QF8efkUrzRj47ZtvoR8wHRyw52_qWqNR9XHz31l5avMe3ABcnnf0UDBHbZk12K9yDWF5YHQxIJIhbgA',
  },
  {
    id: 'novel-al-zeer-salem',
    title: 'سيرة الزير سالم المهلهل',
    author: 'ملحمة حرب البسوس',
    category: 'السير الشعبية العربية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDdhqc3I7gyCxIu2Zf6NduqtEQWE1etB38c8EY_J5-jMQnJzDzO7BzGMLFnZ-ip1NSUgMVOtisScbGQ04qYkzwsa4oUZAepemoPxUtRtxf--Hw1D_nfAs66nAU594mLUjgimne6Eu7yc8tb7j1tyfypiO__DtAoXpnMunN8H6i-XKxc6SSzeMHV8n6U3gmywovVLqniRnBxeJYF91Q96eWB3_7GXVrBtXjdMsG5K89sX25PBklhmHihw',
  },
  {
    id: 'novel-baibars-saga',
    title: 'سيرة الظاهر بيبرس',
    author: 'ملاحم الفتوة الشعبية',
    category: 'السير الشعبية العربية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMcfQadJaQZBmK4_QLfMcHGTkIjH0eDnJZ4NhrJ5T44Ihr4Hetsgqyw9uU7SmGWwbV9hFdGzGKUmjIkel4RhGQu8-t4TSi_BYFClqNEuvpXhlsOfrunWEabsTy1aqozBcMF-D_RpreNJn28IGheRLN-XwsanBWuJlKtG9Ddk9v-wdWQFnH6q4ZH86rZYzRsWu7RGqKzbLljbCwD9m50kpHVvhlRoXEtVyFzgZpyvG2ajxIRncqQaCvDA',
  },
  {
    id: 'novel-dhat-al-himma',
    title: 'سيرة الأميرة ذات الهمة',
    author: 'سير الفداء والثغور',
    category: 'السير الشعبية العربية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7bQQwdHmrNSykeAh09a8gd9gxT7lxsvjw-99P4myZG5CUgvA_C7rbatvO222PAr_DGpDPpzS9JkcLXFiwAq2veb9HtgZNvq302k48CAzD8y1bzgYu49TqCr9YOaAUYRPdK9YjqZ1uISMfq60m_kSw9P9WOmJojl_jFdOPDsTiBvcISTi2x7lvcR0oRwSkH6x03gPJ7JKEDwsSo5mW0QkzK6qWgjZ4yjwAjZWtrJYB17yYSvREC5vbg',
  },
];

// 4. ملاحم الشمال والأساطير الإسكندنافية
export const NORSE_NORTHERN_EPICS: RiwaqEpicItem[] = [
  {
    id: 'novel-beowulf',
    title: 'ملحمة بيوولف',
    author: 'الشعر الأنجلوساكسوني القديم',
    category: 'ملاحم الشمال والنورس',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7bQQwdHmrNSykeAh09a8gd9gxT7lxsvjw-99P4myZG5CUgvA_C7rbatvO222PAr_DGpDPpzS9JkcLXFiwAq2veb9HtgZNvq302k48CAzD8y1bzgYu49TqCr9YOaAUYRPdK9YjqZ1uISMfq60m_kSw9P9WOmJojl_jFdOPDsTiBvcISTi2x7lvcR0oRwSkH6x03gPJ7JKEDwsSo5mW0QkzK6qWgjZ4yjwAjZWtrJYB17yYSvREC5vbg',
  },
  {
    id: 'novel-poetic-edda',
    title: 'الإيدا الشعرية',
    author: 'مخطوطات كوديكس ريجيوس',
    category: 'ملاحم الشمال والنورس',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEDU8hDbplJHvSM0C3kDXuyto9P2iUzBk32XduT5MAP6ukg073RnCJ8WJHXazfVzq31jzh4CiFs_ieEKfkGh4o0yqK0yGrNqmegx20S_eA774X7AsKC5HvHAaqDlJbrcA7m1mvpaGmmHZ14YWsJsJibtbdJ6UOMl-9U8yfUi7JP7mMdo7--AbT7eeDiOwxFxFfo3iFhWYfjBMjghvjxze8rYlZ8XkZGfzAuQ8n2fACdpVnP77El11yQ',
  },
  {
    id: 'novel-volsunga-saga',
    title: 'ملحمة فولسونغا',
    author: 'أساطير سيغورد والنيبلونغ',
    category: 'ملاحم الشمال والنورس',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn0Ka2wBsfst8r95rpEeUPrlD2Su41SnFQ-lvZumRa4HICtcom_o39R1ZlreBZSjPm42qkW1YQj7nG_aRIOuLtQmKnJ7Pgsvi6i3T71JjFg8vGhFXIQeLB5zyiZ8fhHdDIZyM0g7JDTZlbi6-GDYAKPONJ6_oxqAj0nZ9diB5zml5gPsIrfHF8jATEJmdlXI3EzSb0TgqVkVmC6OSsczvi-W0lO_rdBrjqvFzYkKGOkeoV9S2823e4zg',
  },
  {
    id: 'novel-kalevala',
    title: 'الكاليفالا',
    author: 'إلياس لونروت',
    category: 'ملاحم الشمال والنورس',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARZemoP3pTK24UmnbmN4sDC1yZRwRAEt9lB1d41vDz1Dr0n-IeNhyoGcSxhSHsa96uewop6Iu7ZTevPXEEzojwmTl1aOHXvfn6FDRy2XlKUi_LSCF5SBjkuyw5605QE-yhe0x77f-ewnp8XfXYXP-pKMgq983vtQOu0Vd9DofT4A_YI4aM601o30WRg-XK06Jhjlg787v01jtz2LNlJ5gc4ahpM9cAn7_lcNE7gTltZOgNnbRzqbol8A',
  },
  {
    id: 'novel-ragnar-saga',
    title: 'ساجا راغنار لوثبروك',
    author: 'ملاحم الفايكنج القديمة',
    category: 'ملاحم الشمال والنورس',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmht4M8dhW4qouOfD-vV41r8nv1IJNs9vpPPJidZ09Pz1VQtE19aGDuO_lsdBHQvqzjVq8Iu1US-gi58QaTG-i6dNRDKv-m-HqSa0tYNs_85eaxWzKfhv0dUINk0GpA77khIg2Ih_OmE4Gul_5cAfsemzeGQuFN_qGC740JK4TxnXTUTXHCgvQbYQfL-PL86oIqzHbZwut5yDcd8zrvgbJFOxCbibFroAgaQikOSoPZ2D3srSxO4fC8g',
  },
  {
    id: 'novel-njals-saga',
    title: 'ساجا نيال الآيسلندية',
    author: 'سير الشرف والقضاء الآيسلندي',
    category: 'ملاحم الشمال والنورس',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL6AlFLOCu4V_rTCVnxJH8vW5nMl7S3_YByn9RxrhO8N7Huv9KmHVqELO-8uri2TlyEM2wvm2UjndTWpxPF9FdCKvAGjEmVvO0L_eG2nO4D841zgSOGdKrmlyOVO-7tD88arZBBuFWBNJRZCfDMxF-fcyJvxYb-lMJu95l4hjELZHU7TGEPFkHadm3oL5Vi87SuUJv9_cAqz7cxYJMj9a36Wddjs1V1k2tUB-DXG5_7HFVpgSVqzbjeg',
  },
];

// 5. شواهين الشرق وملاحم آسيا الكبرى
export const ASIAN_PERSIAN_EPICS: RiwaqEpicItem[] = [
  {
    id: 'novel-shahnameh',
    title: 'الشاهنامة',
    author: 'أبو القاسم الفردوسي',
    category: 'شواهين الشرق والفرس',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMcfQadJaQZBmK4_QLfMcHGTkIjH0eDnJZ4NhrJ5T44Ihr4Hetsgqyw9uU7SmGWwbV9hFdGzGKUmjIkel4RhGQu8-t4TSi_BYFClqNEuvpXhlsOfrunWEabsTy1aqozBcMF-D_RpreNJn28IGheRLN-XwsanBWuJlKtG9Ddk9v-wdWQFnH6q4ZH86rZYzRsWu7RGqKzbLljbCwD9m50kpHVvhlRoXEtVyFzgZpyvG2ajxIRncqQaCvDA',
  },
  {
    id: 'novel-mahabharata',
    title: 'المهابهاراتا',
    author: 'الحكيم فياسا',
    category: 'ملاحم آسيا وأسفار الهند',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmht4M8dhW4qouOfD-vV41r8nv1IJNs9vpPPJidZ09Pz1VQtE19aGDuO_lsdBHQvqzjVq8Iu1US-gi58QaTG-i6dNRDKv-m-HqSa0tYNs_85eaxWzKfhv0dUINk0GpA77khIg2Ih_OmE4Gul_5cAfsemzeGQuFN_qGC740JK4TxnXTUTXHCgvQbYQfL-PL86oIqzHbZwut5yDcd8zrvgbJFOxCbibFroAgaQikOSoPZ2D3srSxO4fC8g',
  },
  {
    id: 'novel-ramayana',
    title: 'الرامايانا',
    author: 'الشاعر فالميكي',
    category: 'ملاحم آسيا وأسفار الهند',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_eWH_vnKjkYnn6XabpS4W11Vahzp-NBfKHif24pATSicq5IuWuBouWSpSYIfVuKlktkscHojwVyWPpui1oH5R2rkaEhTjiylYVuEHFmDGGKDwAohOpzIzbqokdNcSTkE173lzKVwJoCrPCRmCTf16OChO13EyhGdY1wjgx7uos6zzpXxNxmGpcFTKTAnASnjMsoCFkkT_VxWzNlTkL_WJToJ8GwIoEjojPIVRL7Cx_4f6eLg22QsPLw',
  },
  {
    id: 'novel-gesar-king',
    title: 'ملحمة الملك غيسار',
    author: 'ملاحم التبت وآسيا الوسطى',
    category: 'ملاحم آسيا وأسفار الهند',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXguqalKAYo_emgzQ4kIArKbg3u4gvKSf-L_tzqdpDfi8ZqGq69wG98l5bl_Xe1BQ1oLv3c_YAD_32EBhNv3yE7Rm4fd6ZtVOxip5leVRsvg54h0EMqUrlJ4m7VWY96QLZjdKG9RYamxH34-tCNzXkn9xceCUUlzxzs_HH6t8QF8efkUrzRj47ZtvoR8wHRyw52_qWqNR9XHz31l5avMe3ABcnnf0UDBHbZk12K9yDWF5YHQxIJIhbgA',
  },
  {
    id: 'novel-journey-west',
    title: 'رحلة إلى الغرب',
    author: 'وو تشنغ إن',
    category: 'ملاحم آسيا وأسفار الهند',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDdhqc3I7gyCxIu2Zf6NduqtEQWE1etB38c8EY_J5-jMQnJzDzO7BzGMLFnZ-ip1NSUgMVOtisScbGQ04qYkzwsa4oUZAepemoPxUtRtxf--Hw1D_nfAs66nAU594mLUjgimne6Eu7yc8tb7j1tyfypiO__DtAoXpnMunN8H6i-XKxc6SSzeMHV8n6U3gmywovVLqniRnBxeJYF91Q96eWB3_7GXVrBtXjdMsG5K89sX25PBklhmHihw',
  },
  {
    id: 'novel-manas-epic',
    title: 'ملحمة ماناس العظمى',
    author: 'رواة الماناس القرغيزيون',
    category: 'ملاحم آسيا وأسفار الهند',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7bQQwdHmrNSykeAh09a8gd9gxT7lxsvjw-99P4myZG5CUgvA_C7rbatvO222PAr_DGpDPpzS9JkcLXFiwAq2veb9HtgZNvq302k48CAzD8y1bzgYu49TqCr9YOaAUYRPdK9YjqZ1uISMfq60m_kSw9P9WOmJojl_jFdOPDsTiBvcISTi2x7lvcR0oRwSkH6x03gPJ7JKEDwsSo5mW0QkzK6qWgjZ4yjwAjZWtrJYB17yYSvREC5vbg',
  },
];

// 6. ملاحم العصور الوسطى وفرسان المائدة
export const MEDIEVAL_CHIVALRY_EPICS: RiwaqEpicItem[] = [
  {
    id: 'novel-song-of-roland',
    title: 'نشيد رولاند',
    author: 'فروسية القرون الوسطى',
    category: 'ملاحم العصور الوسطى',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn0Ka2wBsfst8r95rpEeUPrlD2Su41SnFQ-lvZumRa4HICtcom_o39R1ZlreBZSjPm42qkW1YQj7nG_aRIOuLtQmKnJ7Pgsvi6i3T71JjFg8vGhFXIQeLB5zyiZ8fhHdDIZyM0g7JDTZlbi6-GDYAKPONJ6_oxqAj0nZ9diB5zml5gPsIrfHF8jATEJmdlXI3EzSb0TgqVkVmC6OSsczvi-W0lO_rdBrjqvFzYkKGOkeoV9S2823e4zg',
  },
  {
    id: 'novel-el-cid',
    title: 'ملحمة السيد الكامبيادور',
    author: 'ملاحم قشتالة وإسبانيا',
    category: 'ملاحم العصور الوسطى',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEDU8hDbplJHvSM0C3kDXuyto9P2iUzBk32XduT5MAP6ukg073RnCJ8WJHXazfVzq31jzh4CiFs_ieEKfkGh4o0yqK0yGrNqmegx20S_eA774X7AsKC5HvHAaqDlJbrcA7m1mvpaGmmHZ14YWsJsJibtbdJ6UOMl-9U8yfUi7JP7mMdo7--AbT7eeDiOwxFxFfo3iFhWYfjBMjghvjxze8rYlZ8XkZGfzAuQ8n2fACdpVnP77El11yQ',
  },
  {
    id: 'novel-nibelungenlied',
    title: 'أنشودة النيبلونغين',
    author: 'ملاحم الجرمان القديمة',
    category: 'ملاحم العصور الوسطى',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARZemoP3pTK24UmnbmN4sDC1yZRwRAEt9lB1d41vDz1Dr0n-IeNhyoGcSxhSHsa96uewop6Iu7ZTevPXEEzojwmTl1aOHXvfn6FDRy2XlKUi_LSCF5SBjkuyw5605QE-yhe0x77f-ewnp8XfXYXP-pKMgq983vtQOu0Vd9DofT4A_YI4aM601o30WRg-XK06Jhjlg787v01jtz2LNlJ5gc4ahpM9cAn7_lcNE7gTltZOgNnbRzqbol8A',
  },
  {
    id: 'novel-le-morte-darthur',
    title: 'موت الملك آرثر',
    author: 'السير توماس مالوري',
    category: 'ملاحم العصور الوسطى',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL6AlFLOCu4V_rTCVnxJH8vW5nMl7S3_YByn9RxrhO8N7Huv9KmHVqELO-8uri2TlyEM2wvm2UjndTWpxPF9FdCKvAGjEmVvO0L_eG2nO4D841zgSOGdKrmlyOVO-7tD88arZBBuFWBNJRZCfDMxF-fcyJvxYb-lMJu95l4hjELZHU7TGEPFkHadm3oL5Vi87SuUJv9_cAqz7cxYJMj9a36Wddjs1V1k2tUB-DXG5_7HFVpgSVqzbjeg',
  },
  {
    id: 'novel-divine-comedy',
    title: 'الكوميديا الإلهية',
    author: 'دانتي أليغييري',
    category: 'ملاحم العصور الوسطى',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7bQQwdHmrNSykeAh09a8gd9gxT7lxsvjw-99P4myZG5CUgvA_C7rbatvO222PAr_DGpDPpzS9JkcLXFiwAq2veb9HtgZNvq302k48CAzD8y1bzgYu49TqCr9YOaAUYRPdK9YjqZ1uISMfq60m_kSw9P9WOmJojl_jFdOPDsTiBvcISTi2x7lvcR0oRwSkH6x03gPJ7JKEDwsSo5mW0QkzK6qWgjZ4yjwAjZWtrJYB17yYSvREC5vbg',
  },
  {
    id: 'novel-orlando-furioso',
    title: 'أورلاندو فوريوسو',
    author: 'لودوفيكو أريوستو',
    category: 'ملاحم العصور الوسطى',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmht4M8dhW4qouOfD-vV41r8nv1IJNs9vpPPJidZ09Pz1VQtE19aGDuO_lsdBHQvqzjVq8Iu1US-gi58QaTG-i6dNRDKv-m-HqSa0tYNs_85eaxWzKfhv0dUINk0GpA77khIg2Ih_OmE4Gul_5cAfsemzeGQuFN_qGC740JK4TxnXTUTXHCgvQbYQfL-PL86oIqzHbZwut5yDcd8zrvgbJFOxCbibFroAgaQikOSoPZ2D3srSxO4fC8g',
  },
];

// مصادفات الملاحم (Serendipity Pool)
export const ALL_SERENDIPITY_EPICS_POOL: RiwaqEpicItem[] = [
  {
    id: 'novel-atrahasis',
    title: 'أسطورة أتراخاسيس',
    author: 'ألواح أكاد القديمة',
    category: 'ملاحم الشرق القديم',
    alley: 'دهليز ألواح الطين',
    description: 'النص الملحمي الأصلي الذي يروي سر الطوفان العظيم ونجاة الحكيم بحفظ بذور الحياة في سفينة النجاة.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMcfQadJaQZBmK4_QLfMcHGTkIjH0eDnJZ4NhrJ5T44Ihr4Hetsgqyw9uU7SmGWwbV9hFdGzGKUmjIkel4RhGQu8-t4TSi_BYFClqNEuvpXhlsOfrunWEabsTy1aqozBcMF-D_RpreNJn28IGheRLN-XwsanBWuJlKtG9Ddk9v-wdWQFnH6q4ZH86rZYzRsWu7RGqKzbLljbCwD9m50kpHVvhlRoXEtVyFzgZpyvG2ajxIRncqQaCvDA',
  },
  {
    id: 'novel-sayf-dhi-yazan',
    title: 'سيرة سيف بن ذي يزن',
    author: 'تراث حِمير واليمن',
    category: 'السير الشعبية العربية',
    alley: 'دهليز حصون حمير',
    description: 'ملحمة الفتى اليمني وقصة كتاب النيل وخوض المعارك ضد قوى الظلام واسترداد عرش الأجداد.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXguqalKAYo_emgzQ4kIArKbg3u4gvKSf-L_tzqdpDfi8ZqGq69wG98l5bl_Xe1BQ1oLv3c_YAD_32EBhNv3yE7Rm4fd6ZtVOxip5leVRsvg54h0EMqUrlJ4m7VWY96QLZjdKG9RYamxH34-tCNzXkn9xceCUUlzxzs_HH6t8QF8efkUrzRj47ZtvoR8wHRyw52_qWqNR9XHz31l5avMe3ABcnnf0UDBHbZk12K9yDWF5YHQxIJIhbgA',
  },
  {
    id: 'novel-kalevala',
    title: 'الكاليفALA',
    author: 'أساطير فنلندا الشمالية',
    category: 'ملاحم الشمال والنورس',
    alley: 'دهليز جليد الشمال',
    description: 'ملحمة الخلق والغناء الساحر وصناعة طاحونة السامبو العجيبة التي تجلب الثراء والخلود لمن يملكها.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARZemoP3pTK24UmnbmN4sDC1yZRwRAEt9lB1d41vDz1Dr0n-IeNhyoGcSxhSHsa96uewop6Iu7ZTevPXEEzojwmTl1aOHXvfn6FDRy2XlKUi_LSCF5SBjkuyw5605QE-yhe0x77f-ewnp8XfXYXP-pKMgq983vtQOu0Vd9DofT4A_YI4aM601o30WRg-XK06Jhjlg787v01jtz2LNlJ5gc4ahpM9cAn7_lcNE7gTltZOgNnbRzqbol8A',
  },
  {
    id: 'novel-gesar-king',
    title: 'ملحمة الملك غيسار',
    author: 'أساطير التبت الكبرى',
    category: 'ملاحم آسيا وأسفار الهند',
    alley: 'دهليز جبال الهملايا',
    description: 'أطول ملحمة شعرية في التاريخ البشري، تروي مآثر الملك المقاتل الذي نزل إلى الأرض لقهر الشياطين وتثبيت العدل.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7bQQwdHmrNSykeAh09a8gd9gxT7lxsvjw-99P4myZG5CUgvA_C7rbatvO222PAr_DGpDPpzS9JkcLXFiwAq2veb9HtgZNvq302k48CAzD8y1bzgYu49TqCr9YOaAUYRPdK9YjqZ1uISMfq60m_kSw9P9WOmJojl_jFdOPDsTiBvcISTi2x7lvcR0oRwSkH6x03gPJ7JKEDwsSo5mW0QkzK6qWgjZ4yjwAjZWtrJYB17yYSvREC5vbg',
  },
  {
    id: 'novel-el-cid',
    title: 'ملحمة السيد الكامبيادور',
    author: 'فروسية قشتالة القديمة',
    category: 'ملاحم العصور الوسطى',
    alley: 'دهليز دروع الفرسان',
    description: 'نشيد الشرف والشهامة والوفاء للعهد؛ قصة الفارس المغوار رودريغو دياث دي فيفار في حروب الأندلس وقشتالة.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEDU8hDbplJHvSM0C3kDXuyto9P2iUzBk32XduT5MAP6ukg073RnCJ8WJHXazfVzq31jzh4CiFs_ieEKfkGh4o0yqK0yGrNqmegx20S_eA774X7AsKC5HvHAaqDlJbrcA7m1mvpaGmmHZ14YWsJsJibtbdJ6UOMl-9U8yfUi7JP7mMdo7--AbT7eeDiOwxFxFfo3iFhWYfjBMjghvjxze8rYlZ8XkZGfzAuQ8n2fACdpVnP77El11yQ',
  },
  {
    id: 'novel-kirta-epic',
    title: 'ملحمة كيرات الكنعانية',
    author: 'ألواح أوغاريت',
    category: 'ملاحم الشرق القديم',
    alley: 'دهليز شواطئ كنعان',
    description: 'الملحمة الكنعانية القديمة التي تعكس صلوات الملك كيرات من أجل النسل والمجد وسفره عبر بلاد الشام.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL6AlFLOCu4V_rTCVnxJH8vW5nMl7S3_YByn9RxrhO8N7Huv9KmHVqELO-8uri2TlyEM2wvm2UjndTWpxPF9FdCKvAGjEmVvO0L_eG2nO4D841zgSOGdKrmlyOVO-7tD88arZBBuFWBNJRZCfDMxF-fcyJvxYb-lMJu95l4hjELZHU7TGEPFkHadm3oL5Vi87SuUJv9_cAqz7cxYJMj9a36Wddjs1V1k2tUB-DXG5_7HFVpgSVqzbjeg',
  },
];

export const SERENDIPITY_EPICS: RiwaqEpicItem[] = ALL_SERENDIPITY_EPICS_POOL.slice(0, 3);

// الأكثر قراءة هذا الفصل
export const MOST_READ_EPICS = [
  { rank: 1, book: FEATURED_EPICS[0] }, // جلجامش
  { rank: 2, book: FEATURED_EPICS[1] }, // الإلياذة
  { rank: 3, book: FEATURED_EPICS[3] }, // الشاهنامة
  { rank: 4, book: FEATURED_EPICS[4] }, // عنترة بن شداد
  { rank: 5, book: FEATURED_EPICS[2] }, // الأوديسة
  { rank: 6, book: FEATURED_EPICS[5] }, // بيوولف
  { rank: 7, book: FEATURED_EPICS[6] }, // الإنيادة
  { rank: 8, book: FEATURED_EPICS[7] }, // المهابهاراتا
];

// تصنيفات أروقة الملاحم
export const EPIC_GENRE_PILLS = [
  'الكل',
  'ملاحم الشرق وبلاد الرافدين',
  'الملاحم الإغريقية والرومانية',
  'السير الشعبية والفروسية العربية',
  'ملاحم الشمال والأساطير الإسكندنافية',
  'شواهين الشرق وأسفار آسيا',
  'ملاحم العصور الوسطى والفرسان',
];

// فهرس الرواق الكامل للملاحم
export const MASTER_EPICS_CATALOG: RiwaqEpicItem[] = [
  SPOTLIGHT_EPIC,
  ...FEATURED_EPICS,
  ...MESOPOTAMIAN_EPICS,
  ...GREEK_ROMAN_EPICS,
  ...ARABIC_CHIVALRY_EPICS,
  ...NORSE_NORTHERN_EPICS,
  ...ASIAN_PERSIAN_EPICS,
  ...MEDIEVAL_CHIVALRY_EPICS,
  ...ALL_SERENDIPITY_EPICS_POOL,
  ...MOST_READ_EPICS.map(m => m.book),
].reduce((acc, current) => {
  if (!acc.some(item => item.id === current.id)) {
    acc.push(current);
  }
  return acc;
}, [] as RiwaqEpicItem[]);
