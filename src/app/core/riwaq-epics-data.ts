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
  period?: string;
  verseCount?: number;
}

export const SPOTLIGHT_EPIC: RiwaqEpicItem = {
  id: 'novel-gilgamesh',
  title: 'ملحمة جلجامش',
  author: 'ألواح سومر وبابل القديمة',
  category: 'أساطير الرافدين والشرق',
  badge: 'لوح الأزل الرافديني • الألفية الثالثة قبل الميلاد',
  quote: '«هُوَ الذي رَأَى كُلَّ شَيءٍ فَبَلَغَتْ بِهِ الحِكمَةُ أَقَاصِي الأَرضِ، وَعَرَفَ الأَسرَارَ وَغَاصَ فِي لُجَجِ الغَيبِ».',
  coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiFJJaIH-VPmdSZl2j8VAe7NiDalruHE7bkAjkYpxlbkquk0cXYmm4urYtoBncfaHKA_OUsAjOn3LJAevb0GjsiKp1WIIKLOgwJfUMcea8WH4w363phkaZh7XlVJAlGDfAPWi0yUkTmdAa2rTsnl0f3DZxGg9j17yS46cVpG858l960fz08GPRmnSYdYFQTZXQPEghMBoxzAVxqE3WMGYvJ_ktFqVnEEtR9sCjUsvM062tmTcat0H26w',
  description: 'ملحمة الإنسانية الأولى في البحث عن سر الخلود؛ حيث تتصادم رغبة الملك الجبار مع قسوة الفناء، وتتحول رحلته مع رفيقه إنكيدو إلى أقدس ترنيمة شعرية كُتبت بالخط المسماري على ألواح الطين المشوي.',
  period: 'الألفية الثالثة قبل الميلاد',
  verseCount: 3600,
};

// 1. ملاحم العصور الكبرى (الأسفار المؤسسة للوعي الإنساني والوجدان الحضاري)
export const GRAND_ERA_EPICS: RiwaqEpicItem[] = [
  {
    id: 'novel-iliad',
    title: 'الإلياذة',
    author: 'هوميروس',
    category: 'البحر المتوسط والإغريق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsXBTutVCoMnXNcs1KyvICAWxbW60uBsTBoWRVW__pqpqJgpPgnpa8gnxGSglvMQXObV0FVpXTOkuD7vKjZ9M2XfpjFqG1-572wFoVgBgkKEFvJb5wiji8OYoVccNz3LjgfKNVm7LffWvtdAxzsusllY4yO_KWrZQ0SLs6tem6Q88UEbmQzM_X9NFE6Z7jZ2a0Gio9yH1vEbL1imcpmwJO5W0YWAKP7D3kqLizCyqF1S3ymKA8vUZyeg',
    description: 'ملحمة حصار طروادة وغضب أخيل، الصدام بين الأبطال ومشيئة الآلهة الأولمبية.',
  },
  {
    id: 'novel-shahnameh',
    title: 'الشاهنامة',
    author: 'أبو القاسم الفردوسي',
    category: 'شواهين الشرق والفرس',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-fHyUKQr3iIEMcu0FC-coTLdTDh6wE7bYKCaMpbMZSsW60jJzHZdz9WQXMRmKNZk-KD_2JXUHY04M_lh3JGHPofoSH9ar1rcpuVLm_QSvsctXl9PWDojTPtvIVzNgbJcH3BPOV-RhjBKmuwBlRBeFi-xX_rqeuMS85L3hKd9yetfMR_e6LaYPApAFrrfjVBrRiVNbBy8SF5sGYsLGu-gF8LHqFoyX-xaSVhZYCJHno6QUld-HnW3Nlg',
    description: 'كتاب الملوك وأعظم ملاحم الشرق الفارسي، بطولات رستم وسهراب وصراع النور والظلمة.',
  },
  {
    id: 'novel-odyssey',
    title: 'الأوديسة',
    author: 'هوميروس',
    category: 'البحر المتوسط والإغريق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvmyplPjT36osdni1n4iK35bZS9hH0rDN3G10F-v2W3LAh5Bfg8u5xmUSBA_Sr8xIk9YEPQ_UNxCem8hIwK50gvCraU7yeZ5inYCfUDoxDXVYi2f6VhETgVtrYfaoT46NSMcZGVb2GCDS8Ed552j09MLlzqe77ApSFu9uqUusUKUPKNNI5iWdimLW_X9QCuZIDDLWx4MuwuDzg5bttHxXa0tCBetanGrct0r453DdB_7h7qSzXZELcyw',
    description: 'رحلة أوديسيوس البحرية العاصفة للعودة إلى إيثاكا ومواجهة أهوال البحار والمسوخ.',
  },
  {
    id: 'novel-taghriba-hilaliyya',
    title: 'تغريبة بني هلال',
    author: 'الرواية الشفاهية الكبرى',
    category: 'السير الشعبية وتراث الفرسان',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyIIgIbZCuhd0-zSYHMGNBZlLEBP7SIclTqrX7PXPDmLVlNckUZauJX_w9j9TXLDaUCMQ_TlzAVtmX-rq8RS86ESiwaglzr_GIZP61GPjPCBuQ2jqcLyXdoOE9v1QSUwEdPYWNAh-9dx4ECYp6ic0ZPU1D59HHC1-ndp8AXUxRVwqD08ZB4rTFTEtXPtCYogEi_JYK1RFCm9h9iGhtjrl2VHqjW5-0ozjhOukYHyzCnU87cuzhiO3iww',
    description: 'التغريبة الهلالية الكبرى ورحلة الفرسان من نجد إلى بلاد المغرب بقيادة أبي زيد الهلالي.',
  },
  {
    id: 'novel-aeneid',
    title: 'الإنيادة',
    author: 'فيرجيل',
    category: 'البحر المتوسط والإغريق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXpcTtaK0LYXZF9TxOKh0nAGIOxo244tgSFp7-S1_prCUY11AkQL6DCsKjE__nQxJIMCt7j9qtaxpKPY8g0WbfIyt87HR4F1Dd_boVyHDyBVJkzERc1Mtf93AamoZ2-IN0aODxKWQHM5zyuZr41qdpSzzK-TSmpsExgjfaaTpskaV6eq6tVurC-Nz1ueucWyjHdkxa07yd2EOhKJ4VGszTLsbN09SdHi-TY6zCHmnmLepWWmVvRJwuog',
    description: 'ملحمة روما التأسيسية، خروج إينياس من أطلال طروادة المحترقة لتأسيس الإمبراطورية.',
  },
  {
    id: 'novel-antarah',
    title: 'سيرة عنترة بن شداد',
    author: 'تراث الفروسية العربية',
    category: 'السير الشعبية وتراث الفرسان',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjL44PbWlgjS5HkopGD-VtHH9ytHcCsX4yyRjrYGueMQ7K1k0b_TzL8bJubG37eKGl_46I5SmWwJ2gBuB_hmDZX1_TA9AOcIoJBgIZGMnRWvqY1i2WRjN1iNKsuv-LKbjzFwUpOGgHUeMWJ5i5ZhzcK7y9xTTrhixOtCVFhrSQgA2tm3BrHjc8ZzXogvCAV_zCBZR0YtbyLzAgcO9KLNT2pO_-NHlc-DcE9pkmTT3iX_gzlXNCp5u71A',
    description: 'ديوان البطولة والفداء، قصة فارس بني عبس وصهيل فرسه الأدهم في طلب الحرية والكرامة.',
  },
  {
    id: 'novel-gilgamesh-card',
    title: 'ملحمة جلجامش',
    author: 'ألواح بابل وسومر',
    category: 'أساطير الرافدين والشرق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiFJJaIH-VPmdSZl2j8VAe7NiDalruHE7bkAjkYpxlbkquk0cXYmm4urYtoBncfaHKA_OUsAjOn3LJAevb0GjsiKp1WIIKLOgwJfUMcea8WH4w363phkaZh7XlVJAlGDfAPWi0yUkTmdAa2rTsnl0f3DZxGg9j17yS46cVpG858l960fz08GPRmnSYdYFQTZXQPEghMBoxzAVxqE3WMGYvJ_ktFqVnEEtR9sCjUsvM062tmTcat0H26w',
    description: 'أقدم ترنيمة شعرية في تاريخ الحضارة منقوشة بالخط المسماري في بهو الأزل.',
  },
  {
    id: 'novel-mahabharata',
    title: 'المهابهاراتا',
    author: 'الحكيم فياسا',
    category: 'شواهين الشرق والفرس',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmht4M8dhW4qouOfD-vV41r8nv1IJNs9vpPPJidZ09Pz1VQtE19aGDuO_lsdBHQvqzjVq8Iu1US-gi58QaTG-i6dNRDKv-m-HqSa0tYNs_85eaxWzKfhv0dUINk0GpA77khIg2Ih_OmE4Gul_5cAfsemzeGQuFN_qGC740JK4TxnXTUTXHCgvQbYQfL-PL86oIqzHbZwut5yDcd8zrvgbJFOxCbibFroAgaQikOSoPZ2D3srSxO4fC8g',
    description: 'سفر الحكمة العظيم وحرب الكوروكشترا الكبرى في تراث الهند الخالد.',
  },
];

// 2. أساطير الشرق وبلاد ما بين النهرين
export const MESOPOTAMIAN_EASTERN_EPICS: RiwaqEpicItem[] = [
  {
    id: 'novel-enuma-elish',
    title: 'إينوما إيليش',
    author: 'ألواح التكوين البابلية',
    category: 'أساطير الرافدين والشرق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKg1f94UpsBicTm4G2yXhE_AWG4Ve8XBQunczszjKbo6PxQrCeoNLvqoNxWAubB5Jr6j0iuRbg1YI6zXErDKJy5kaWSWwQT2ubXQxsfb_bc4fqGoe5zELfWF_-efBM6fvLrlMjovUCWK04gNiL0V23Nj5rQOxGNDZgfs4YgTpOJ3c6iejgER9C4IK3yxdhf9eQwooA_zuMqGZDD7USYCYZpW-gK9wLmz3UdTzC6O5KRNsoApGpzGMkjA',
    description: 'ملحمة التكوين البابلية؛ صراع مردوخ مع تيامات وتشكيل قبة السماء وأركان الوجود.',
  },
  {
    id: 'novel-descent-ishtar',
    title: 'هبوط عشتار',
    author: 'أناشيد بابل وسومر',
    category: 'أساطير الرافدين والشرق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDORiURuugCjJHnlIeQXKsNdIXge4jBGXLEJSrFMjdYxu5bYA5BevIfLINTzwFzjNvE76hx7G5_FOIzPj2a3RhVTPtgU1-jdo2QYjEkvp08sz2sqIoUdRIl51fuGn2irWDAO1rspjHolI_h0Uh5P8PyGWJjISnQ4TuzUvtV7MyBtq3EXYrg4s9M7S3-DcfY61n1h5n_pIL6pO-S3DJw_0x1iVb-ZpEKMIt15aR5zqYnvLxXgy0cm4Yxyg',
    description: 'نزول سيدة السماء إلى العالم السفلي عبر البوابات السبع لاستعادة تموز.',
  },
  {
    id: 'novel-book-of-dead',
    title: 'كتاب الخروج إلى النهار',
    author: 'كهنة طيبة ومصر القديمة',
    category: 'أساطير الرافدين والشرق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiCYPd6sdarM1yES8Jl4Yn5Hoyv6GyAIWlOoWjouml9lT7YiSf9SoHzj1BoxIMvU-8DY2TpAuIleiPHz1ZJRAjitPxQAOJpF0T6xW0SXFBx_Qp0Flm7pvRJPPKdOKp0rSG3ZMQN-VRW95ddu0jVnFqs9ChOGWklhw3odMkf-XAP2beSh4R_w41oj_GAULs-pAKAfktwrWYso5QNck1E2KuqEwW2f2OJ2IJ5iBJJ7AtntG_IzufKLjREQ',
    description: 'نصوص التحول والخلود والعبور الآمن إلى حقول إيارو أمام محكمة أوزوريس.',
  },
  {
    id: 'novel-atrahasis',
    title: 'ملحمة أطرحاسيس',
    author: 'ألواح الطوفان الأكادية',
    category: 'أساطير الرافدين والشرق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDckaeGyQ8Aj4zJ9AQ9NvwB1970XUmi-6ptZCKgWfSuKHCfX1gU-lKOLRfy_QlWq9Dm40iNKPeaRKFLINMiIP9FYXGK_KuhrZ55IjMcyWK6ATD0Xp_SZdGCedQE22fgoj7nk2ymghw25wtfFXQ4g7xCgbmc55u-8zUwAxcGo7pFtGxIrVlTxJrxcIE9qowLeAkxhVnxfEhlbGznlz7PvTuXiM3sg_tBCFJusnDthhElOgswVQCtpkvGqQ',
    description: 'قصة خلق الإنسان وحكمة النجاة من الطوفان العظيم عبر إرشادات الإله إنكي.',
  },
  {
    id: 'novel-baal-anat',
    title: 'ملحمة بعل وعناة',
    author: 'ألواح أوغاريت الكنعانية',
    category: 'أساطير الرافدين والشرق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeLyCWdxZXiMLHFc0wryURDvsEwVVS23aIZPR8CTS7m76BXwLdO25Y9VmPMnvUPA7KLBHCF23pPEe_g7lajYa5SkTTnXEZ_18yiP9-lxIOLp9fjuPnVBMW2C-cr2tz-Zy9DicQrhUAasaQClHM-9Z1JwmANV5iNehGDn3KOrqmUY7mqjbxMGvwn_wqH0Noe-GR17KGyevZncCHB34vBeFlEeKIipxaAqByrfMPIVAC5ZnvS1znInvokg',
    description: 'ملحمة إله العواصف بعل وصراعه مع موت إله الهلاك على قمة جبل صافون.',
  },
  {
    id: 'novel-etana',
    title: 'أسطورة إيتانا والنسر',
    author: 'مخطوطات كيش القديمة',
    category: 'أساطير الرافدين والشرق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXguqalKAYo_emgzQ4kIArKbg3u4gvKSf-L_tzqdpDfi8ZqGq69wG98l5bl_Xe1BQ1oLv3c_YAD_32EBhNv3yE7Rm4fd6ZtVOxip5leVRsvg54h0EMqUrlJ4m7VWY96QLZjdKG9RYamxH34-tCNzXkn9xceCUUlzxzs_HH6t8QF8efkUrzRj47ZtvoR8wHRyw52_qWqNR9XHz31l5avMe3ABcnnf0UDBHbZk12K9yDWF5YHQxIJIhbgA',
    description: 'رحلة ملك كيش على ظهر النسر إلى عوالم الآلهة للبحث عن نبتة الإنجاب.',
  },
];

// 3. حروب الأساطير والإلياذة الكبرى (Western & Classical Epics)
export const HELLENIC_WAR_EPICS: RiwaqEpicItem[] = [
  {
    id: 'novel-song-of-roland',
    title: 'أنشودة رولان',
    author: 'فروسية القرون الوسطى',
    category: 'البحر المتوسط والإغريق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRJn1YtTdCRpk5M9rwI41tc299zMA0sXc_WqlcnvdMwjggGOk0hwZhWFmwpTPctJkh8_LiLAjvNx4N6naqmEfSC4egoGPw0LMaxgjSGQKFIdynzrht-wqsMVhxnz-_RtYwhsge-03fGwt3cc6ifOsjjgI9CfKpl-H3LBSYqAMWAZwJ62itBCfPPAZSHyHMQt5zTjjy9tw4xXrz-U6BL2UIy7Jq9u0g293724mTO5V_6LCkSqqM9-jbkw',
    description: 'ملحمة الفارس رولان ونداء بوق الأوليفان في ممر رونسفال بين جبال البرانس.',
  },
  {
    id: 'novel-beowulf',
    title: 'بيوولف',
    author: 'الشعر الأنجلوساكسوني القديم',
    category: 'ملاحم الشمال والجليد',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1jpI1qluP4Aq6j4xGWr0QCIzTCogm33H0yyKN5zC-264KMYV2eEtmlGByyT81yVKNZAkY6oIANlipCoMz53O8EG11jVnPaDM_DSAVIQXpBEUZQiM20vSjniUNVcBmoEir7mLP1np5cDHB96fLjrYGgF1M0AmZgGjrZfBFp3Go4O0sfFkqUhPnu3gDLuHznv0xR_lrL0lFpJNTcRsx64oukvl9mDnpvG4kSMqJx5_nhfcpw1_zGcItkA',
    description: 'البطل الأسطوري الذي هزم المسخ غرندل وتنين الذهب لحماية قومه.',
  },
  {
    id: 'novel-argonautica',
    title: 'الآرغونوتيكا',
    author: 'أبولونيوس الرودسي',
    category: 'البحر المتوسط والإغريق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ4CWUoqw_UK6XSEGagH_q5hnOXfi8SVdc8gd4lvn2JzaGbRoeEBOzgzrokDQGGkpnqKsC-WPaUXNLXGMgLwvfhywnLidgeydEe9lrG-zfrlzOOA8rsZUbYvoB9vXBWk-iMF28xDDETy5oMZUHEze8qvV-lApxjkbnvGTOzf6E9eeUUgsERLdT0HDUDVMhUN3_3f_bCcEjLA5879jiKf8UeuIvCfoIcHMwc8eJYSt21Lbi_hknz-HX9g',
    description: 'رحلة جاسون وبحارة الآرغو عبر الأمواج الهادرة للظفر بالصوف الذهبي.',
  },
  {
    id: 'novel-poetic-edda',
    title: 'الإيدا الشعرية',
    author: 'مخطوطات كوديكس ريجيوس',
    category: 'ملاحم الشمال والجليد',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn-t41Ve2LbgvDwZyjHl_gNSZxn_g3t41EfsRj8irF-Fg-6DcUXl3xVhfhkKHdGW4TialC6Stzcwc7SRiPSnKQhI-5LWGJCUXVD8jj8jr9lfM6DaZyq8hwlFM_SE8Hwl0nZZwwIrDbYWxCFQvFAl9HzLO077cx2pq_nxpjyClLvc9K0zzV0EduAjFQoiLIVFkB_219JsiKTvC07dPERuO-UbB3jrC3sTJuB-WS4nlVXCNbElUNX5n2_w',
    description: 'أناشيد الآلهة النوردية وشجرة إغدراسيل ونبوءة الفولوسبا بنهاية العالم راغناروك.',
  },
  {
    id: 'novel-fall-of-troy',
    title: 'سقوط طروادة',
    author: 'كوينتوس سميرنايوس',
    category: 'البحر المتوسط والإغريق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCx00eZh-qDDaDkNlbVQ9exnmp5bqtEtb8zOPTJBLRp7QT8R7nx0qb6ukj-iXlV4s_aiv3cEPv18GeMOKh6LbyWzyXJNFo69dGZnan8ZNa3W4oNXoTAt1GTEhYRoG9HOAfiASCZ9R4BwHc6LwsNImv9kbiknxhOooniRVJkIr6-2rDzwjCM9QzBGdq3VUcqIcixORTmAHQqzPTBko7uQkO1UDd65p7vhMAF1gVcf41nAu-1kRiZ991Zqg',
    description: 'الأيام الأخيرة لحصار طروادة، ومكيدة حصان الخشب واشتعال الأسوار العتيدة.',
  },
  {
    id: 'novel-theogony',
    title: 'الثيوغونيا (أنساب الآلهة)',
    author: 'هسيود',
    category: 'البحر المتوسط والإغريق',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_eWH_vnKjkYnn6XabpS4W11Vahzp-NBfKHif24pATSicq5IuWuBouWSpSYIfVuKlktkscHojwVyWPpui1oH5R2rkaEhTjiylYVuEHFmDGGKDwAohOpzIzbqokdNcSTkE173lzKVwJoCrPCRmCTf16OChO13EyhGdY1wjgx7uos6zzpXxNxmGpcFTKTAnASnjMsoCFkkT_VxWzNlTkL_WJToJ8GwIoEjojPIVRL7Cx_4f6eLg22QsPLw',
    description: 'سفر ولادة الآلهة وصعود زيوس إلى عرش الأولمب وهزيمة التيتان.',
  },
];

// 4. السير الشعبية وتراث الفرسان (Arabian & Chivalric Siyar)
export const ARABIAN_FOLK_SIYAR: RiwaqEpicItem[] = [
  {
    id: 'novel-al-zeer-salem',
    title: 'الزير سالم (أبو ليلى المهلهل)',
    author: 'ملحمة حرب البسوس',
    category: 'السير الشعبية وتراث الفرسان',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDF0rTxuRFGLGVf9zSlnzum-OQk8xwBxT2UyrqycP2vX4LoCimvT4GNdfdf6ZChvaez--QJ-_aHYgjg9nkpwTHYWvwzZIhkCbdIQC4qpCdzd9duQePa_6NjIK1auRNgMKi3wAFlQUXeFDfu_8vhOUYvOnuqkNTvp_223CjEeFCtSqyGToUaVNoXY-6-hY-QBqajCkYIktlnHCzvZQSk2vSvreuokPAbwrnb2KzrGI_J4l2W4XmBV__g_Q',
    description: 'حرب البسوس المستعرة لأربعين عاماً طلباً لثأر كليب، ومرثيات المهلهل في صحراء نجد.',
  },
  {
    id: 'novel-baibars-saga',
    title: 'سيرة الظاهر بيبرس',
    author: 'ملاحم الفتوة الشعبية',
    category: 'السير الشعبية وتراث الفرسان',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPeUF2IhUPrrNrCjtpTxTswDf43EEbD0xYAHsFKlGaWhRAbKY7MA7nASSLzLvRx8fx-8VKWJSALOCcK9FHL9sJ5qXOe7CdGPAc3D_VOjpU8_9OO-P5I4ekRbhfBvhlNwqScJ4_92QBB2aziwUIEvxre5Som3uECNYaiGqcaTlsPd5HQrxxrtsGM0SS7XcnJzAGCiQjmbzpXaO37dm4g8mn3qbmPJvr6Wewn8joacz7PfKr9lqMEA77LQ',
    description: 'ملحمة سلطان المماليك في حماية بلاد الشام ومصر وهزيمة المغول في شوارع القاهرة.',
  },
  {
    id: 'novel-sayf-dhi-yazan',
    title: 'سيف بن ذي يزن',
    author: 'أساطير حِمْيَر واليمن',
    category: 'السير الشعبية وتراث الفرسان',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDN7HLKMQuo4YYTiNWDVuzhYdBbJB5ZYrT5PulBhw-EJc725jRoyXTCoMkEdRyv3FaKoBQb4hsWboZPpf1Sy2USmG6i_H7gG3gfaFz-3SWXFl1Dm0b1JrqyjWHH6Gp439m8ukiaFLpvZSlQjbtjqZnEcBAHbW3czofMhQds-O7TprMLpGZtlBYis7SMrQugn5IFI7NUVtFbJlo_CR6901CW9-VKwAWvdrfHO6nONUAbuWlpPPEsxbfVQg',
    description: 'سفر الأميرة بلقيس وجنود الجن وسعي الفتى الحميري لفك طلاسم نيل مصر.',
  },
  {
    id: 'novel-dhat-al-himma',
    title: 'سيرة ذات الهمة',
    author: 'سير الفداء والثغور',
    category: 'السير الشعبية وتراث الفرسان',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq4iX4Y2VZ1d5X-hjgCJrxEdkdKRGwwIjRfjuAPKpHlubqxXOFWyt10aXGg8iyVoaNr6Ow_Pr96-GCkCfaCheZDfg749cGqZ1wLLOz12_lWPpAP1SEqZEkH8awbDZkoi1DMRdrEGQapv5t_HAic6R8uFCy_O0V9bQus1DUlfAYXFMHVbYjtJI-fg4Yr_pmA6vpTwVfx3Nmf9QmanYDtOi_VvWGXaQXFE6XFq7i59PbevID3V0XPk_4JQ',
    description: 'سيرة الفارسة العربية فاطمة ذات الهمة وفتوحها في بلاد الروم دفاعاً عن الثغور.',
  },
  {
    id: 'novel-ali-zaybaq',
    title: 'سيرة علي الزيبق',
    author: 'فولكلور الحرافيش والشطار',
    category: 'السير الشعبية وتراث الفرسان',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC09VjTrvt5WG-mDQnkM3be_FQy0-9C5oCd17W1hCITn6-ZHU-s43YhnJ0v7O5DnuXPDjQkXvznGd5d1lPyPQh5BEXUZRDqe3B0zxGWcNW7IHbox8JGrUd2BSp0UaNHTvUwj9ASu3DOia1Yj7rRsiv-yUiRrdMYGDUCdtWPqb2bXyUMzEDmHVjJ6SQaHkjUoVEyIB0-wGV0BIroVy_wPo7WDC9NzhP63E4Dr6SeYAUKEeHTIXwsOTj0xQ',
    description: 'حيل الشطار في قاهرة الفاطميين والمماليك، مواجهة الظلم بالحيلة والذكاء الشعبي.',
  },
  {
    id: 'novel-antarah-folk',
    title: 'سيرة عنترة بن شداد',
    author: 'تراث الفروسية العربية',
    category: 'السير الشعبية وتراث الفرسان',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjL44PbWlgjS5HkopGD-VtHH9ytHcCsX4yyRjrYGueMQ7K1k0b_TzL8bJubG37eKGl_46I5SmWwJ2gBuB_hmDZX1_TA9AOcIoJBgIZGMnRWvqY1i2WRjN1iNKsuv-LKbjzFwUpOGgHUeMWJ5i5ZhzcK7y9xTTrhixOtCVFhrSQgA2tm3BrHjc8ZzXogvCAV_zCBZR0YtbyLzAgcO9KLNT2pO_-NHlc-DcE9pkmTT3iX_gzlXNCp5u71A',
    description: 'مآثر فارس عبس في ديار العرب وملاحم الوفاء لعبلة في وجه شمس الصحراء.',
  },
];

// 5. الملاحم الأكثر تداولاً وتدويناً (Top 5 Ranked)
export const TOP_RANKED_EPICS = [
  {
    rank: '١',
    title: 'ملحمة جلجامش',
    subtitle: 'رافدينية • لوح الخلود',
    icon: 'workspace_premium',
    id: 'novel-gilgamesh',
    isTop: true,
  },
  {
    rank: '٢',
    title: 'الإلياذة لهوميروس',
    subtitle: 'إغريقية • حصار طروادة',
    icon: 'hotel_class',
    id: 'novel-iliad',
    isTop: false,
  },
  {
    rank: '٣',
    title: 'سيرة بني هلال',
    subtitle: 'عربية • التغريبة الكبرى',
    icon: 'hotel_class',
    id: 'novel-taghriba-hilaliyya',
    isTop: false,
  },
  {
    rank: '٤',
    title: 'الشاهنامة للفردوسي',
    subtitle: 'فارسية • كتاب الملوك',
    icon: 'hotel_class',
    id: 'novel-shahnameh',
    isTop: false,
  },
  {
    rank: '٥',
    title: 'سيرة عنترة بن شداد',
    subtitle: 'عربية • فخر وفروسية',
    icon: 'hotel_class',
    id: 'novel-antarah',
    isTop: false,
  },
];

// 6. بوصلة العصور الأسطورية (3 Epochs Bento)
export interface EpochItem {
  id: string;
  era: string;
  title: string;
  description: string;
  countBadge: string;
  accent: 'bronze' | 'gold' | 'crimson';
}

export const MYTHIC_EPOCHS: EpochItem[] = [
  {
    id: 'epoch-bronze',
    era: '٣٠٠٠ ق.م — ١٢٠٠ ق.م',
    title: 'عصر البرونز وفجر الأساطير',
    description: 'ألواح سومر، معابد بابل، وترانيم النيل قبل ولادة الأبجديات الحديثة.',
    countBadge: '١٨ ملحمة موثقة',
    accent: 'bronze',
  },
  {
    id: 'epoch-classical',
    era: '٨٠٠ ق.م — ٤٠٠ م',
    title: 'العصر الهيليني والكلاسيكي',
    description: 'حروب طروادة، مصائر الأوديسة، ونشيد الإنيادة تحت رعاية جبل الأولمب.',
    countBadge: '٢٤ ملحمة موثقة',
    accent: 'gold',
  },
  {
    id: 'epoch-medieval',
    era: '٥٠٠ م — ١٤٠٠ م',
    title: 'عصر الفرسان والسير الشعبية',
    description: 'ديوان الملاحم العربية، مآثر بني هلال، وملاحم الشمال الإسكندنافية.',
    countBadge: '٢٠ ملحمة موثقة',
    accent: 'crimson',
  },
];

// Master Catalog for NovelStore and global lookups
export const MASTER_EPICS_CATALOG: RiwaqEpicItem[] = [
  SPOTLIGHT_EPIC,
  ...GRAND_ERA_EPICS,
  ...MESOPOTAMIAN_EASTERN_EPICS,
  ...HELLENIC_WAR_EPICS,
  ...ARABIAN_FOLK_SIYAR,
].reduce((acc, curr) => {
  if (!acc.some(item => item.id === curr.id)) {
    acc.push(curr);
  }
  return acc;
}, [] as RiwaqEpicItem[]);
