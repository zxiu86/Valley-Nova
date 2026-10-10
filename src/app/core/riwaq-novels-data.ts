export interface RiwaqBookItem {
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

export const SPOTLIGHT_BOOK: RiwaqBookItem = {
  id: 'novel-obsidian-labyrinth',
  title: 'متاهة حجر السج',
  author: 'أديب الأروقة',
  category: 'الفانتازيا الملحمية',
  badge: 'جوهرة الشهر التحريرية',
  quote: '“في تلك الممرات التي لم تطأها الشمس، كانت الظلال تهمس بأسماء الذين ضلوا الطريق قبل قرون سبعة...”',
  coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmht4M8dhW4qouOfD-vV41r8nv1IJNs9vpPPJidZ09Pz1VQtE19aGDuO_lsdBHQvqzjVq8Iu1US-gi58QaTG-i6dNRDKv-m-HqSa0tYNs_85eaxWzKfhv0dUINk0GpA77khIg2Ih_OmE4Gul_5cAfsemzeGQuFN_qGC740JK4TxnXTUTXHCgvQbYQfL-PL86oIqzHbZwut5yDcd8zrvgbJFOxCbibFroAgaQikOSoPZ2D3srSxO4fC8g',
  description: 'في دهاليز قصر قديم مهجور، يجد باحث مخطوطات نفسه محاصراً بين جدران عاكسة تعيد سرد ذكريات لم يعشها، حيث يرقد الحرف ليعاود النهوض حياً في ضمير القارئ.'
};

export const FEATURED_SELECTION_BOOKS: RiwaqBookItem[] = [
  {
    id: 'novel-mirror-palace',
    title: 'ظلال قصر المرآة',
    author: 'أ. ج. بلاكوود',
    category: 'غموض قوطي',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7bQQwdHmrNSykeAh09a8gd9gxT7lxsvjw-99P4myZG5CUgvA_C7rbatvO222PAr_DGpDPpzS9JkcLXFiwAq2veb9HtgZNvq302k48CAzD8y1bzgYu49TqCr9YOaAUYRPdK9YjqZ1uISMfq60m_kSw9P9WOmJojl_jFdOPDsTiBvcISTi2x7lvcR0oRwSkH6x03gPJ7JKEDwsSo5mW0QkzK6qWgjZ4yjwAjZWtrJYB17yYSvREC5vbg',
  },
  {
    id: 'novel-seven-meteorites',
    title: 'رماد النيازك السبعة',
    author: 'سرديات الخلود',
    category: 'فانتازيا ملحمية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEDU8hDbplJHvSM0C3kDXuyto9P2iUzBk32XduT5MAP6ukg073RnCJ8WJHXazfVzq31jzh4CiFs_ieEKfkGh4o0yqK0yGrNqmegx20S_eA774X7AsKC5HvHAaqDlJbrcA7m1mvpaGmmHZ14YWsJsJibtbdJ6UOMl-9U8yfUi7JP7mMdo7--AbT7eeDiOwxFxFfo3iFhWYfjBMjghvjxze8rYlZ8XkZGfzAuQ8n2fACdpVnP77El11yQ',
  },
  {
    id: 'novel-silent-gates',
    title: 'مدينة الأبواب الصامتة',
    author: 'رواق الروايات',
    category: 'أساطير المكان',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL6AlFLOCu4V_rTCVnxJH8vW5nMl7S3_YByn9RxrhO8N7Huv9KmHVqELO-8uri2TlyEM2wvm2UjndTWpxPF9FdCKvAGjEmVvO0L_eG2nO4D841zgSOGdKrmlyOVO-7tD88arZBBuFWBNJRZCfDMxF-fcyJvxYb-lMJu95l4hjELZHU7TGEPFkHadm3oL5Vi87SuUJv9_cAqz7cxYJMj9a36Wddjs1V1k2tUB-DXG5_7HFVpgSVqzbjeg',
  },
  {
    id: 'novel-crimson-abyss',
    title: 'مخطوطة الهاوية الحمراء',
    author: 'أرشيف الرواق',
    category: 'سحر أسود وغموض',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn0Ka2wBsfst8r95rpEeUPrlD2Su41SnFQ-lvZumRa4HICtcom_o39R1ZlreBZSjPm42qkW1YQj7nG_aRIOuLtQmKnJ7Pgsvi6i3T71JjFg8vGhFXIQeLB5zyiZ8fhHdDIZyM0g7JDTZlbi6-GDYAKPONJ6_oxqAj0nZ9diB5zml5gPsIrfHF8jATEJmdlXI3EzSb0TgqVkVmC6OSsczvi-W0lO_rdBrjqvFzYkKGOkeoV9S2823e4zg',
  },
  {
    id: 'novel-last-raven',
    title: 'تراتيل الغراب الأخير',
    author: 'بلاك وود',
    category: 'شعر وسرد قوطي',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARZemoP3pTK24UmnbmN4sDC1yZRwRAEt9lB1d41vDz1Dr0n-IeNhyoGcSxhSHsa96uewop6Iu7ZTevPXEEzojwmTl1aOHXvfn6FDRy2XlKUi_LSCF5SBjkuyw5605QE-yhe0x77f-ewnp8XfXYXP-pKMgq983vtQOu0Vd9DofT4A_YI4aM601o30WRg-XK06Jhjlg787v01jtz2LNlJ5gc4ahpM9cAn7_lcNE7gTltZOgNnbRzqbol8A',
  },
  {
    id: 'novel-crimson-memory',
    title: 'شظايا الذاكرة القرمزية',
    author: 'إيناس القاسم',
    category: 'دراما نفسية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbPU-IigdAGrRu40SW_tCJ61a2YA6xXbhkStLy84rwBm0VhXuU8kI0xiSfIDYs1AN4iAlrDWLwzhcSP5TtBJZV_8hlpgG_CwGVNrwZpfzXfFRdQEy6Pul69L33bh8QTdScBB-V0yjv7tCxP54WtW7J2DbsaSkalgqvReylbnpIIIBg_FsAy0oAjSUOL0beibNudiezqeW8DsyZQjYJSYUpy6MFOpRfmzJxCa_C8OX_6_y0VfxjjUXNVA',
  },
];

export const FANTASY_BOOKS: RiwaqBookItem[] = [
  {
    id: 'novel-wandering-dragons',
    title: 'تاج التنانين التائهة',
    author: 'زينب الحارثي',
    category: 'الفانتازيا الملحمية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkuGw687RykPWCaY_p9mGA6pU-hg5t88PM_aM9hUC73xJRTl38B4ePRG0eKc2M4sj3AG8l_bPgfbYUkKviCb9n2wn4qJX2nk_kbZTGxiHkVHipV9cBncbNuuHfmww4w5HMDH88UNGr0Fv6WyueqhJ8wClBxwDcJMrpIotwM3VWPGQzk-4bJB9flzyzwo7TZcH656sINf3s547QEtNMfexvMYQdMg6CD5Xs6hpIfjEcEzKbebKGZV_AHA',
  },
  {
    id: 'novel-extinguished-stars',
    title: 'حارس النجوم المطفأة',
    author: 'ليرا فانس',
    category: 'فانتازيا كونية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwV2Yd6ZOPJeei9atcVqIyhLTQlw7ZO0CTfGGhMTx4wSf0uu0g8CCGDFu6Y2QA0CmeFkC7Lx04h9RTDLWZ3Yoyz_GTRms0H87tkDzU6uo4rt-oVnglc-ORwAzrXVxdLXeHT813BB-Nw6RnggFIqV80m27WxF5QPGKDMsa4ZKYb5PQwvuc7WDRC7JgEfqoOMHMUpHkpijkgoFnptNTKkEPawKLHJ-bbl0uRA118Ohww6ssV9WERBmPcrg',
  },
  {
    id: 'novel-eternal-fog',
    title: 'وادي الضباب الأزلي',
    author: 'ألكسندر كين',
    category: 'فانتازيا مظلمة ومغامرات',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkB_f_x3xtKzbDINKEY9EuTds7MU6D-ub13897Vx3CcLynGzAPpQLXSDcOpbg35cAtPh1XF2Wm0O2DneafQsExOc8YQNJvmjPZnmzOJiS3bbYH8-C-33nOwYPlVvQlo2kCJucAbJNXpq3NCYSbWYVWF7EQbKvY8AFAzuaDyFzqOPzifpRSqnGvyGmelua4pZCFvHew0bYAWQ5O1698mqJhtWZ3OTpN_25f_FdlSHUNNRwI9LRLbp2esg',
  },
  {
    id: 'novel-lineage-ash',
    title: 'سلالة الرماد',
    author: 'إلارا فانس',
    category: 'ملحمة النار والمصير',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAW9ooIbGP2YaLOv4T1SwTNq0_3h9CJMNAQwy5HSlexI-bBdNt7525I3jBJFjT--9l00btq-FYv5JSmkgmHblvOYJxpcjN2R9iu8MdU-qkqO8juB_FzkzK9TnBR9QnG5QmpDGCL3KE2U4MAaZXWKq-FSmZV9GrDMxZAMTs2HvfIlMm5PgjL55Ofhw4z6XudkChD45-c8hofDo4U-IzVRfVharq-KuIPUcu3G5SDiH5MpTDzB1fF6stmWg',
  },
  {
    id: 'novel-citadel-dusk',
    title: 'قلعة الشفق',
    author: 'أ. ر. ثورن',
    category: 'فانتازيا قوطية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdZhkrZvcVDc-piSv3CRq0xW3gzzA1vyBkwBnXS38tlgUHEnVZFeFzYq8bapupGgVG-8NCZCT73TvKvJIGSU7jfrvIQgnWvvyH8XAfKlYy2NpDOTR349dmF5gdE7hYXKJln-W-yH2Ovip6TZCJfZt9_f4qOjmj9Y48ye7JOT_ebAG221axp8_4c8RdfVc50GYsQtUtJFB_EqNgNJI3oOx-HTB51BBlS-fRvWcKcits0foya-6cbwX3Tg',
  },
];

export const MYSTERY_BOOKS: RiwaqBookItem[] = [
  {
    id: 'novel-room-zero',
    title: 'غرفة رقم صفر',
    author: 'إلياس كرم',
    category: 'رواية غموض وإثارة',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDV1nh_ZAWwhQkQoDvEruuVN_uTDsvzuI4EXuG9T7U9fm1fGMaacFsuTju_0xlIPNzMbYJ0P5gClpJFJVlVSMgC-JS6ym2OCWtHoOs7ZWPud292zdD8o41Nf0fXcCvr661yckBvu6JSz5AfhOXiXB5HP55CWWVGZ5kHdU3LwVlqWYu7pOBYrFsoqpTvPdP4X1H2jQbKvl9LgSr4rVr9dhchkuhar-PCmulNqm-PfxpNSTyX0E_L6VJtHw',
  },
  {
    id: 'novel-whispering-catacombs',
    title: 'همس السراديب',
    author: 'إبراهيم كروكس',
    category: 'رعب نفسي قوطي',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAO4dS3jbvR0CN8m3G4sYkYvAl1eO-B3wDy9kAhpoHNHMVe3rqj0kgmuFWUs9pfmOyv0gLS99kCw-n8FL31xMCJHuT8-1tQ06-_Baa0C2eXdR19YFwM3GTouPmdDrfn5BkXDPNBsYXiiDT59z40Vj3aXTuLZwNkrMrcx3cZhChKtTmnko1KjaYItHmnPN0mIQxnY3YKROpQTx7dJiJ-gJgAG-CQKwCzGbFvthAia4pCy_2SW4jEXGs3TA',
  },
  {
    id: 'novel-blind-detective',
    title: 'لغز المحقق الأعمى',
    author: 'توفيق إبراهيم',
    category: 'أدب التحقيق والجريمة',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCM3UP63KjrVVIzb-INn_4htKyT7klJh7sccslOab1tukDzTGQfttjgdMUnjVbe146Abx59dnLJzM5m7NNx5iqkuQdJN7aAQAv4XbZSTH49Ti-dVM9wo9endJG52-O3zVAeBRoCcKzqWurHJI-Afm3ttOhvMEwsKnyQcIF97JaucZxv0Y0TAz4h0D2E52N8guipFMucEtP9_JZNbXxGbHEyNXqp0C-wmfuT4i-1_DRQ5nt3aZAvdnNTBQ',
  },
  {
    id: 'novel-crimson-zero-hour',
    title: 'ساعة الصفر القرمزية',
    author: 'د. ك. فوستر',
    category: 'تشويق زمني',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOuGfz15oSAvKiUjuqEHHBqEts4z1W6dII0P3lN1cNHuKzE205YVf81IdTLz3PkTbHVOrDBAUz5-gYTq5-WqoRoAH_PxVBay1h8OS5LhJU0sqGDFz-Fv2sOBpTdZQlCz6QM0MuISjFIJLrvzTQ2Mpi4ben2AwWzp5qngB9JFGRbWSN9IFgdrLDfMEutsvrctylzEsQ8EjsDZY88H9NvZRTyBIDA314nTI7O2vqE5rT8jeHxLb8ji7iug',
  },
  {
    id: 'novel-mask-regret',
    title: 'قناع الندم',
    author: 'إيناس القاسم',
    category: 'غموض نفسي',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9Qwkby9Faj06D5XN-t_VIwp2GPKUNjiZthMVEEIaF57IE2MXjc0-QwiS749z-lqpOiIjoZnfHIhIQ4--6tUhd9g_cGnlTnUgTk0HQagderUOXmB2pEGcjrFMGuDZMzlVep2CO6VQi8BJ1g70OtV7GeEtpQACAaMlLhIsBuMXbsR3kA6BNbw7c5GiHwSytbrIqYw3rxL8jmfHCIUhJQQ5k2DGDPvYjeKF_CvbqVs-2WZDZ18PMYeqCXw',
  },
];

export const GOTHIC_BOOKS: RiwaqBookItem[] = [
  {
    id: 'novel-last-raven',
    title: 'تراتيل الغراب الأخير',
    author: 'أدغار بلاكوود',
    category: 'أدب الرعب القوطي',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARZemoP3pTK24UmnbmN4sDC1yZRwRAEt9lB1d41vDz1Dr0n-IeNhyoGcSxhSHsa96uewop6Iu7ZTevPXEEzojwmTl1aOHXvfn6FDRy2XlKUi_LSCF5SBjkuyw5605QE-yhe0x77f-ewnp8XfXYXP-pKMgq983vtQOu0Vd9DofT4A_YI4aM601o30WRg-XK06Jhjlg787v01jtz2LNlJ5gc4ahpM9cAn7_lcNE7gTltZOgNnbRzqbol8A',
  },
  {
    id: 'novel-whispering-catacombs',
    title: 'همس السراديب',
    author: 'إبراهيم كروكس',
    category: 'أدب الرعب القوطي',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAO4dS3jbvR0CN8m3G4sYkYvAl1eO-B3wDy9kAhpoHNHMVe3rqj0kgmuFWUs9pfmOyv0gLS99kCw-n8FL31xMCJHuT8-1tQ06-_Baa0C2eXdR19YFwM3GTouPmdDrfn5BkXDPNBsYXiiDT59z40Vj3aXTuLZwNkrMrcx3cZhChKtTmnko1KjaYItHmnPN0mIQxnY3YKROpQTx7dJiJ-gJgAG-CQKwCzGbFvthAia4pCy_2SW4jEXGs3TA',
  },
  {
    id: 'novel-citadel-dusk',
    title: 'قلعة الشفق',
    author: 'أ. ر. ثورن',
    category: 'أدب الرعب القوطي',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdZhkrZvcVDc-piSv3CRq0xW3gzzA1vyBkwBnXS38tlgUHEnVZFeFzYq8bapupGgVG-8NCZCT73TvKvJIGSU7jfrvIQgnWvvyH8XAfKlYy2NpDOTR349dmF5gdE7hYXKJln-W-yH2Ovip6TZCJfZt9_f4qOjmj9Y48ye7JOT_ebAG221axp8_4c8RdfVc50GYsQtUtJFB_EqNgNJI3oOx-HTB51BBlS-fRvWcKcits0foya-6cbwX3Tg',
  },
  {
    id: 'novel-crimson-abyss',
    title: 'مخطوطة الهاوية الحمراء',
    author: 'أرشيف الرواق',
    category: 'أدب الرعب القوطي',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn0Ka2wBsfst8r95rpEeUPrlD2Su41SnFQ-lvZumRa4HICtcom_o39R1ZlreBZSjPm42qkW1YQj7nG_aRIOuLtQmKnJ7Pgsvi6i3T71JjFg8vGhFXIQeLB5zyiZ8fhHdDIZyM0g7JDTZlbi6-GDYAKPONJ6_oxqAj0nZ9diB5zml5gPsIrfHF8jATEJmdlXI3EzSb0TgqVkVmC6OSsczvi-W0lO_rdBrjqvFzYkKGOkeoV9S2823e4zg',
  },
  {
    id: 'novel-mirror-palace',
    title: 'ظلال قصر المرآة',
    author: 'أ. ج. بلاكوود',
    category: 'أدب الرعب القوطي',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7bQQwdHmrNSykeAh09a8gd9gxT7lxsvjw-99P4myZG5CUgvA_C7rbatvO222PAr_DGpDPpzS9JkcLXFiwAq2veb9HtgZNvq302k48CAzD8y1bzgYu49TqCr9YOaAUYRPdK9YjqZ1uISMfq60m_kSw9P9WOmJojl_jFdOPDsTiBvcISTi2x7lvcR0oRwSkH6x03gPJ7JKEDwsSo5mW0QkzK6qWgjZ4yjwAjZWtrJYB17yYSvREC5vbg',
  },
];

export const DRAMA_BOOKS: RiwaqBookItem[] = [
  {
    id: 'novel-crimson-memory',
    title: 'شظايا الذاكرة القرمزية',
    author: 'إيناس القاسم',
    category: 'الدراما النفسية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbPU-IigdAGrRu40SW_tCJ61a2YA6xXbhkStLy84rwBm0VhXuU8kI0xiSfIDYs1AN4iAlrDWLwzhcSP5TtBJZV_8hlpgG_CwGVNrwZpfzXfFRdQEy6Pul69L33bh8QTdScBB-V0yjv7tCxP54WtW7J2DbsaSkalgqvReylbnpIIIBg_FsAy0oAjSUOL0beibNudiezqeW8DsyZQjYJSYUpy6MFOpRfmzJxCa_C8OX_6_y0VfxjjUXNVA',
  },
  {
    id: 'novel-mask-regret',
    title: 'قناع الندم',
    author: 'منى الشريف',
    category: 'الدراما النفسية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9Qwkby9Faj06D5XN-t_VIwp2GPKUNjiZthMVEEIaF57IE2MXjc0-QwiS749z-lqpOiIjoZnfHIhIQ4--6tUhd9g_cGnlTnUgTk0HQagderUOXmB2pEGcjrFMGuDZMzlVep2CO6VQi8BJ1g70OtV7GeEtpQACAaMlLhIsBuMXbsR3kA6BNbw7c5GiHwSytbrIqYw3rxL8jmfHCIUhJQQ5k2DGDPvYjeKF_CvbqVs-2WZDZ18PMYeqCXw',
  },
  {
    id: 'novel-shiraz-clockmaker',
    title: 'ساعات شيراز المعلقة',
    author: 'فارس التميمي',
    category: 'الدراما النفسية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_kI8la7WWxxd8sUnF5dXoru8BiE9CDumGSbFAbx0WL_7aK3DV0qsBb4cKKbriN4dTPyjHhwKAVJw1MxuXT-G63SrapqEc-d4P4kO7HZ2vY8aWMvt5vEMck6i2J1Y0xFgaY_FUkn2yiSlw0K53qvucO828z7HsAtAqys7LD4g82-4jtvLnwBAYJlYJEPpbgi7bmd2OMgQYYAihg_8gpTRasywI_CDchKKpFCxqLX3cMKUoBl_konIW3A',
  },
  {
    id: 'novel-seven-meteorites',
    title: 'رماد النيازك السبعة',
    author: 'سرديات الخلود',
    category: 'الدراما النفسية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEDU8hDbplJHvSM0C3kDXuyto9P2iUzBk32XduT5MAP6ukg073RnCJ8WJHXazfVzq31jzh4CiFs_ieEKfkGh4o0yqK0yGrNqmegx20S_eA774X7AsKC5HvHAaqDlJbrcA7m1mvpaGmmHZ14YWsJsJibtbdJ6UOMl-9U8yfUi7JP7mMdo7--AbT7eeDiOwxFxFfo3iFhWYfjBMjghvjxze8rYlZ8XkZGfzAuQ8n2fACdpVnP77El11yQ',
  },
  {
    id: 'novel-room-zero',
    title: 'غرفة رقم صفر',
    author: 'إلياس كرم',
    category: 'الدراما النفسية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDV1nh_ZAWwhQkQoDvEruuVN_uTDsvzuI4EXuG9T7U9fm1fGMaacFsuTju_0xlIPNzMbYJ0P5gClpJFJVlVSMgC-JS6ym2OCWtHoOs7ZWPud292zdD8o41Nf0fXcCvr661yckBvu6JSz5AfhOXiXB5HP55CWWVGZ5kHdU3LwVlqWYu7pOBYrFsoqpTvPdP4X1H2jQbKvl9LgSr4rVr9dhchkuhar-PCmulNqm-PfxpNSTyX0E_L6VJtHw',
  },
];

export const MAGIC_REALISM_BOOKS: RiwaqBookItem[] = [
  {
    id: 'novel-glass-botanist',
    title: 'نباتات الأعماق الزجاجية',
    author: 'أروى اليماني',
    category: 'الواقعية السحرية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOnxIpeoi68lV3AhP3STvkYlgdu-K1nJQ53HPn_8WObbaRRGjQEpjaC4w0yy0SLA0591xuzwEsIN9OeSbo7a2i4RXtyif8DG6kKQzoKHKoDuH48zcbgxrLE7EhktSyhWXamipLME4UK_3YRw-3-qTt2ffq10AH9J7dI4ilhPC5PLSjPP02rS_MZiFwtprQmD34J3Hhqf1MN8YynOKKlbwmaC2juotTeKeV9BVf83eIqqUnOegGfRwzMg',
  },
  {
    id: 'novel-chronicler-red-winds',
    title: 'مؤرخ الريح الحمراء',
    author: 'عبد الحميد كاتب',
    category: 'الواقعية السحرية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5NbbbG_5cbZjPSPjr7y1qA8XYGKyN5XKIf-Zo-J3u7GaB6Aj6UKGJl1TXpQwuD3ZZ9abZuBwCMwI-4BkrPByV8iX19-OzajM9Sxbgp8jMXaNIaTLRP7-qymRqnzeKBBYVAGJVikHeLP7ra1QrlQZMVZXc2Qg5hPyCo-ZseKzVqlUQaDAmNVtEtjoiQds2sbtdEsPyKBfk4AOzP7Tgpbc4VnMVHD0IueSK8beVYtgvdOTNJr8Q3B2hlw',
  },
  {
    id: 'novel-silent-gates',
    title: 'مدينة الأبواب الصامتة',
    author: 'رواق الروايات',
    category: 'الواقعية السحرية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL6AlFLOCu4V_rTCVnxJH8vW5nMl7S3_YByn9RxrhO8N7Huv9KmHVqELO-8uri2TlyEM2wvm2UjndTWpxPF9FdCKvAGjEmVvO0L_eG2nO4D841zgSOGdKrmlyOVO-7tD88arZBBuFWBNJRZCfDMxF-fcyJvxYb-lMJu95l4hjELZHU7TGEPFkHadm3oL5Vi87SuUJv9_cAqz7cxYJMj9a36Wddjs1V1k2tUB-DXG5_7HFVpgSVqzbjeg',
  },
  {
    id: 'novel-wandering-dragons',
    title: 'تاج التنانين التائهة',
    author: 'زينب الحارثي',
    category: 'الواقعية السحرية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkuGw687RykPWCaY_p9mGA6pU-hg5t88PM_aM9hUC73xJRTl38B4ePRG0eKc2M4sj3AG8l_bPgfbYUkKviCb9n2wn4qJX2nk_kbZTGxiHkVHipV9cBncbNuuHfmww4w5HMDH88UNGr0Fv6WyueqhJ8wClBxwDcJMrpIotwM3VWPGQzk-4bJB9flzyzwo7TZcH656sINf3s547QEtNMfexvMYQdMg6CD5Xs6hpIfjEcEzKbebKGZV_AHA',
  },
  {
    id: 'novel-eternal-fog',
    title: 'وادي الضباب الأزلي',
    author: 'ألكسندر كين',
    category: 'الواقعية السحرية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkB_f_x3xtKzbDINKEY9EuTds7MU6D-ub13897Vx3CcLynGzAPpQLXSDcOpbg35cAtPh1XF2Wm0O2DneafQsExOc8YQNJvmjPZnmzOJiS3bbYH8-C-33nOwYPlVvQlo2kCJucAbJNXpq3NCYSbWYVWF7EQbKvY8AFAzuaDyFzqOPzifpRSqnGvyGmelua4pZCFvHew0bYAWQ5O1698mqJhtWZ3OTpN_25f_FdlSHUNNRwI9LRLbp2esg',
  },
];

export const SCIFI_BOOKS: RiwaqBookItem[] = [
  {
    id: 'novel-auroras-last-station',
    title: 'محطة أورورا الأخيرة',
    author: 'إليزا فانس',
    category: 'خيال علمي صلب',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAz1xq6XuC38uev7bkxfGlrGDz6aru-Oulp4S1mTAn_R0E-v_RY6oWjm1eSWjfyMCdXk6TaLx2CA1UyYtbyyilDRQM0H6XIfFWZRAV6mb5xu7xb8-m5sGN4DaUDKsMfuS3i14N_Kn6hwb7paN6HfprYJgCYuwh-6ea99GW9Ke-2fE2lD75yzjCAbNLKS6Mj6j4oAeUNGr_fTypozXYNfLaQWhjHSDuo9o6Vmo4sAED5PhuK-4a9aqbFg',
  },
  {
    id: 'novel-stray-machine-mind',
    title: 'عقل الآلة الشارد',
    author: 'إلارا فانس',
    category: 'ذكاء اصطناعي وفلسفة',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXkiJjM7iZaJYnvI98kpb5atDLiGgyvsv3TWYZdzjaptGU69b5CJUaLyrzeEPZw5i-_CmNzspljG_PVgUu9ZjQ31IHwd45VtqCX7Vt_zcVcYVjn_51D9DQEIa6ajKrEdZ8WkgP7mWa8jbRDkX-x_wNBr8eTYa7XWPMZpU2WVW-_2spYiUUtonpFMOPBD7HOkb3Z-cP8uX6o8cfAojOUyZX_YJkS2qhTU1CshQ1Mzd7LpQ4HAIOT5eVhg',
  },
  {
    id: 'novel-mirage-orbit',
    title: 'رحلة إلى مدار السراب',
    author: 'إلارا فانس',
    category: 'أوديسة الفضاء العميق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxjpLGhEmxCArxK6YJASqLYPPxjR54FlDNcCGO7aBp4KfztuggG_FWr00godCjHBaiy5Ee12cNjZrp6jfmRQL2whS1i_hlFWGaUyhuJk1FfM0rRMp6sLcbCkzRkb3FKSLFWZ3d9A0F3Inqo8iuRK1Y-wUCHVj7krypPy3XRr0IxQTxpkhETvLu1derEAdu3vTH0rC-JsIzojErJNGqPByeQqSjmxekDczkhwgZDxrv4iG5A9j3uw0tJg',
  },
  {
    id: 'novel-parallel-universes',
    title: 'نبض الأكوان الموازية',
    author: 'أحمد السعد',
    category: 'عوالم متوازية',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjKw8Xkp_LfdP4MzZM8qZ6-wfyz4CdGOMBVprYbai6GkYa5O-5bjZzhuJdRVwYA3nzQSnCV-uZtgLnFM1rhJ_cmBufnVpM6Imusq7Cx4pFa5Bnn2ZxF1htMWDQd_MWkmY_fHVVRkXdcAKQoWMyUTdpQJL3UViSwgXqseXdpT6TxMfjj8IKQcxQVaT3o5qL2FsZgLDlvWbZ2Qf__fkMJKJi9fBn5HxFwzffttIOm46FiJNS0nuDc8ggBw',
  },
  {
    id: 'novel-cyber-phantoms',
    title: 'أطياف السايبر',
    author: 'خالد البلوشي',
    category: 'سايبربانك ونوار',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-mdteKK_bhwmkb94UIKbQ1aPUTDoy6ZP52lwgManI_sbSHK3G7KRP72rcwFoqdjmckbh5eohR4Ah1MVfwfQzIJ6cPHiU6V0N9iask5RYuDTJGsY_mKqsUBIoqeuf-hexEa4XPXCgVnYTts7bb_wREisICOCj-OsMRG4I4ktJWDeWbqhsTqdUBn4h0QGD8J9NBqwpeXqfLjFf_WU-Y2WRxLpj1_8HVLhYhFyg9-Z58eraL4T9FsNublg',
  },
];

export const SERENDIPITY_BOOKS: RiwaqBookItem[] = [
  {
    id: 'novel-shiraz-clockmaker',
    title: 'ساعات شيراز المعلقة',
    alley: 'دهليز الأدب المقارن',
    description: 'عن صانع ساعات يتلاعب بمسار الذكريات في أزقة مدينة منسية.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_kI8la7WWxxd8sUnF5dXoru8BiE9CDumGSbFAbx0WL_7aK3DV0qsBb4cKKbriN4dTPyjHhwKAVJw1MxuXT-G63SrapqEc-d4P4kO7HZ2vY8aWMvt5vEMck6i2J1Y0xFgaY_FUkn2yiSlw0K53qvucO828z7HsAtAqys7LD4g82-4jtvLnwBAYJlYJEPpbgi7bmd2OMgQYYAihg_8gpTRasywI_CDchKKpFCxqLX3cMKUoBl_konIW3A',
  },
  {
    id: 'novel-glass-botanist',
    title: 'نباتات الأعماق الزجاجية',
    alley: 'دهليز الواقعية السحرية',
    description: 'حديقة غامضة تتفتح بتلاتها فقط حين يكتم الزائر أنفاسه.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOnxIpeoi68lV3AhP3STvkYlgdu-K1nJQ53HPn_8WObbaRRGjQEpjaC4w0yy0SLA0591xuzwEsIN9OeSbo7a2i4RXtyif8DG6kKQzoKHKoDuH48zcbgxrLE7EhktSyhWXamipLME4UK_3YRw-3-qTt2ffq10AH9J7dI4ilhPC5PLSjPP02rS_MZiFwtprQmD34J3Hhqf1MN8YynOKKlbwmaC2juotTeKeV9BVf83eIqqUnOegGfRwzMg',
  },
  {
    id: 'novel-chronicler-red-winds',
    title: 'مؤرخ الريح الحمراء',
    alley: 'دهليز المخطوط الحافل',
    description: 'سجلات مفقودة لمدينة لم تكن تظهر إلا في مواسم العواصف القرمزية.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5NbbbG_5cbZjPSPjr7y1qA8XYGKyN5XKIf-Zo-J3u7GaB6Aj6UKGJl1TXpQwuD3ZZ9abZuBwCMwI-4BkrPByV8iX19-OzajM9Sxbgp8jMXaNIaTLRP7-qymRqnzeKBBYVAGJVikHeLP7ra1QrlQZMVZXc2Qg5hPyCo-ZseKzVqlUQaDAmNVtEtjoiQds2sbtdEsPyKBfk4AOzP7Tgpbc4VnMVHD0IueSK8beVYtgvdOTNJr8Q3B2hlw',
  },
];

export const ALL_SERENDIPITY_POOL: RiwaqBookItem[] = [
  ...SERENDIPITY_BOOKS,
  {
    id: 'novel-mirror-palace',
    title: 'ظلال قصر المرآة',
    alley: 'دهليز الغموض الأبدي',
    description: 'ممرات قصر تعكس مصائر مَن يدخله دون أن يلتفت للوراء.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG7bQQwdHmrNSykeAh09a8gd9gxT7lxsvjw-99P4myZG5CUgvA_C7rbatvO222PAr_DGpDPpzS9JkcLXFiwAq2veb9HtgZNvq302k48CAzD8y1bzgYu49TqCr9YOaAUYRPdK9YjqZ1uISMfq60m_kSw9P9WOmJojl_jFdOPDsTiBvcISTi2x7lvcR0oRwSkH6x03gPJ7JKEDwsSo5mW0QkzK6qWgjZ4yjwAjZWtrJYB17yYSvREC5vbg',
  },
  {
    id: 'novel-silent-gates',
    title: 'مدينة الأبواب الصامتة',
    alley: 'دهليز الأسفار المنسية',
    description: 'حكاية مسافر يبحث عن الباب السابع في مدينة تبتلع زوارها.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL6AlFLOCu4V_rTCVnxJH8vW5nMl7S3_YByn9RxrhO8N7Huv9KmHVqELO-8uri2TlyEM2wvm2UjndTWpxPF9FdCKvAGjEmVvO0L_eG2nO4D841zgSOGdKrmlyOVO-7tD88arZBBuFWBNJRZCfDMxF-fcyJvxYb-lMJu95l4hjELZHU7TGEPFkHadm3oL5Vi87SuUJv9_cAqz7cxYJMj9a36Wddjs1V1k2tUB-DXG5_7HFVpgSVqzbjeg',
  },
  {
    id: 'novel-stray-machine-mind',
    title: 'عقل الآلة الشارد',
    alley: 'دهليز الذكاء الماورائي',
    description: 'عندما تبدأ الآلات بالحلم بالنجوم التي سبقت خلق البشرية.',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXkiJjM7iZaJYnvI98kpb5atDLiGgyvsv3TWYZdzjaptGU69b5CJUaLyrzeEPZw5i-_CmNzspljG_PVgUu9ZjQ31IHwd45VtqCX7Vt_zcVcYVjn_51D9DQEIa6ajKrEdZ8WkgP7mWa8jbRDkX-x_wNBr8eTYa7XWPMZpU2WVW-_2spYiUUtonpFMOPBD7HOkb3Z-cP8uX6o8cfAojOUyZX_YJkS2qhTU1CshQ1Mzd7LpQ4HAIOT5eVhg',
  },
];

export const MOST_READ_BOOKS: { rank: string; book: RiwaqBookItem }[] = [
  {
    rank: '١',
    book: {
      id: 'novel-obsidian-labyrinth',
      title: 'متاهة حجر السج',
      author: 'إلياس و حداد',
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMBCKv8_ncc43uKqLMMXfxJRi6_qq-xPx86_bxAmeq_AaoCFTs90cZcXaBlE3pMG599hVtrOCjWRUD2JPud1-LRgTJDTYXNywHAvcVVMc3dYLOWghH1oY5gTKa_pnwg8XKVQp8qDDpwey0uoGW2F0fxxY_pxcdse6qp_1Zdjjsi-rXZUkXq_AS4lkNMNNKD8dT4AwecKAFcwrl6hVPvSLdKCYtMTE_fTGGMgba7ucJxoTuCv3an0hFzA',
    },
  },
  {
    rank: '٢',
    book: {
      id: 'novel-crimson-memory',
      title: 'شظايا الذاكرة',
      author: 'إلياس كرم',
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyATf1F8-FWc1TWGA9Ck3nibSdghN-Vc6JFhdMIaMOmcdW2vwapUo5E3ZoZoo22I8V2AFQPoRjwX7HVRbjbbFH0tDLYrmVXSYD4wgsFsKXagY19kyhQ11JqOozCNVud-I46JDoF5Udw6zLTuFjWCqE1keLpYWaxW4yZDw8TGu2i4LQI8L9g0LI-Vepk4sRUb2p5q3jwQlfceOV5RBi-22WbNVEJuc6ysRM9g_PYfz-_u7yeNetVMCXWQ',
    },
  },
  {
    rank: '٣',
    book: {
      id: 'novel-room-zero',
      title: 'غرفة رقم صفر',
      author: 'أحمد خليل',
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSIx9SSclxC60W5Tj-xgExWyXwxgeOXRzeU3bllTUWazeprDjaZ_SM9vHMYO84KS7_ML3rax8TUmKOwVOxwTTgZkRfHILS7mwOfydiHrWlRrxXZXhtio-R5ipniaRNKQL-5K3nxDH495xmouZNiz-iY3c9TyYeQNF0CgkgmUXjHVRxsO2pQ2mogq0E_I_du3GBgePcxiUD9Id0k73DxUW4md5QMwFLozo6d160bORhzCHw7IlcoJWy-w',
    },
  },
  {
    rank: '٤',
    book: {
      id: 'novel-wandering-dragons',
      title: 'تاج التنانين التائهة',
      author: 'زينب الحارثي',
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIrX88HCNpqhpNKljkHD3haB7j2pzXd2IF4i4pdtcNOZdvwM_DSVAMLx32Eblsy3jnmVwM-W-2boRtEKP04WMJy1v-wBfVxrmOlMJrSVl3qSiYMRwrbMjYjAUlPvSvBrJjh5q24d3ViY6JwQUpOOG4EcQQNdMa0tjtzrqrSE_WccVinTFssGt-fRKU84G0obselwYZ8BTn2lVJ_veT0Mws6_NMeprDZ0CLK28iUTbSkNWxPAyoWlLYFg',
    },
  },
  {
    rank: '٥',
    book: {
      id: 'novel-auroras-last-station',
      title: 'محطة أورورا الأخيرة',
      author: 'إلياس قسطور',
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHxmG9UBLaVpHNcgG7EpusDcrUM_HhiF4A4apcGCWMWrzjOOOnnIYj0WIXn1IeCuJ1-ImtdqOcir_QuGYJ7U4pGslNMuJhKgHuJ4u_IOOMQxR3-Qx1jcr_k_fjbQgC46iyLO3gsSZzo3OCOODctSi8_EWo402e4RlPaYJiaFwKI7Wi8P6dS-qJLDcS_L6C7kdTkbDFtlAD3K2q-SMIwtH50EpSwHXesVe1GpcDAPOkbPueddnJho9CaQ',
    },
  },
];

export const GENRE_PILLS = [
  'الكل',
  'الفانتازيا الملحمية',
  'الغموض والتشويق',
  'أدب الرعب القوطي',
  'الخيال العلمي',
  'الدراما النفسية',
  'الواقعية السحرية',
];

export const MASTER_RIWAQ_CATALOG: RiwaqBookItem[] = [
  SPOTLIGHT_BOOK,
  ...FEATURED_SELECTION_BOOKS,
  ...FANTASY_BOOKS,
  ...MYSTERY_BOOKS,
  ...GOTHIC_BOOKS,
  ...SCIFI_BOOKS,
  ...DRAMA_BOOKS,
  ...MAGIC_REALISM_BOOKS,
  ...ALL_SERENDIPITY_POOL,
  ...MOST_READ_BOOKS.map(m => m.book),
].reduce((acc, curr) => {
  if (!acc.some(b => b.id === curr.id)) {
    acc.push(curr);
  }
  return acc;
}, [] as RiwaqBookItem[]);
