// UI-string translations for the language toggle (separate from *content*
// language — this controls the app's own labels/buttons, not which
// titles are shown). Covers the most user-visible strings; anything not
// listed here falls back to English rather than showing a raw key.
export type Locale = "en" | "hi" | "mr";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी"
};

type Dict = Record<string, string>;

export const TRANSLATIONS: Record<Locale, Dict> = {
  en: {
    "header.watchlist": "Watchlist",
    "hero.headingPrefix": "Must-Watch",
    "hero.headingSuffix": "of the Week",
    "section.movies": "New Movies This Week",
    "section.webSeries": "New Web Series This Week",
    "section.documentaries": "Documentaries This Week",
    "section.filteredMovies": "Movies",
    "section.filteredSeries": "Web Series",
    "calendar.title": "Release Calendar",
    "filter.searchPlaceholder": "Search titles, cast, or directors…",
    "filter.filters": "Filters",
    "filter.allPlatforms": "All Platforms",
    "filter.allGenres": "All Genres",
    "filter.clearAll": "Clear all",
    "week.thisWeek": "This Week",
    "week.comingUp": "Coming Up",
    "title.viewDetails": "View Details",
    "title.watchOn": "Watch on",
    "title.addToWatchlist": "Add to Watchlist",
    "title.saved": "Saved",
    "title.watchTrailer": "Watch Trailer",
    "title.notifyMe": "Notify Me",
    "title.reminderSet": "Reminder Set",
    "recommendations.forYou": "Recommended For You",
    "recommendations.because": "Because you watched",
    "footer.tagline": "Fresh Friday–Thursday picks in Hindi, Marathi & English",
    "reviews.title": "User Reviews",
    "reviews.postReview": "Post review",
    "aiVerdict.title": "Quick AI Verdict",
    "loadMore": "Load More",
    "noResults": "No titles match your filters this week — try widening your search."
  },
  hi: {
    "header.watchlist": "वॉचलिस्ट",
    "hero.headingPrefix": "ज़रूर देखें",
    "hero.headingSuffix": "इस हफ़्ते",
    "section.movies": "इस हफ़्ते की नई फ़िल्में",
    "section.webSeries": "इस हफ़्ते की नई वेब सीरीज़",
    "section.documentaries": "इस हफ़्ते की डॉक्यूमेंट्री",
    "section.filteredMovies": "फ़िल्में",
    "section.filteredSeries": "वेब सीरीज़",
    "calendar.title": "रिलीज़ कैलेंडर",
    "filter.searchPlaceholder": "टाइटल, कलाकार या निर्देशक खोजें…",
    "filter.filters": "फ़िल्टर",
    "filter.allPlatforms": "सभी प्लेटफ़ॉर्म",
    "filter.allGenres": "सभी शैलियाँ",
    "filter.clearAll": "सभी हटाएं",
    "week.thisWeek": "इस हफ़्ते",
    "week.comingUp": "आने वाला",
    "title.viewDetails": "विवरण देखें",
    "title.watchOn": "यहाँ देखें:",
    "title.addToWatchlist": "वॉचलिस्ट में जोड़ें",
    "title.saved": "सहेजा गया",
    "title.watchTrailer": "ट्रेलर देखें",
    "title.notifyMe": "मुझे सूचित करें",
    "title.reminderSet": "रिमाइंडर सेट",
    "recommendations.forYou": "आपके लिए अनुशंसित",
    "recommendations.because": "क्योंकि आपने देखा",
    "footer.tagline": "हिंदी, मराठी और अंग्रेज़ी में शुक्रवार–गुरुवार की ताज़ा पसंद",
    "reviews.title": "उपयोगकर्ता समीक्षाएं",
    "reviews.postReview": "समीक्षा पोस्ट करें",
    "aiVerdict.title": "त्वरित AI राय",
    "loadMore": "और देखें",
    "noResults": "इस हफ़्ते आपके फ़िल्टर से कोई टाइटल मेल नहीं खाता — खोज को थोड़ा और खोलें।"
  },
  mr: {
    "header.watchlist": "वॉचलिस्ट",
    "hero.headingPrefix": "नक्की पाहा",
    "hero.headingSuffix": "या आठवड्यातील",
    "section.movies": "या आठवड्यातील नवीन चित्रपट",
    "section.webSeries": "या आठवड्यातील नवीन वेब सिरीज",
    "section.documentaries": "या आठवड्यातील डॉक्युमेंटरी",
    "section.filteredMovies": "चित्रपट",
    "section.filteredSeries": "वेब सिरीज",
    "calendar.title": "रिलीज कॅलेंडर",
    "filter.searchPlaceholder": "शीर्षक, कलाकार किंवा दिग्दर्शक शोधा…",
    "filter.filters": "फिल्टर",
    "filter.allPlatforms": "सर्व प्लॅटफॉर्म",
    "filter.allGenres": "सर्व शैली",
    "filter.clearAll": "सर्व साफ करा",
    "week.thisWeek": "या आठवड्यात",
    "week.comingUp": "लवकरच येत आहे",
    "title.viewDetails": "तपशील पाहा",
    "title.watchOn": "इथे पाहा:",
    "title.addToWatchlist": "वॉचलिस्टमध्ये जोडा",
    "title.saved": "जतन केले",
    "title.watchTrailer": "ट्रेलर पाहा",
    "title.notifyMe": "मला सूचित करा",
    "title.reminderSet": "स्मरणपत्र सेट",
    "recommendations.forYou": "तुमच्यासाठी शिफारस केलेले",
    "recommendations.because": "कारण तुम्ही पाहिले",
    "footer.tagline": "हिंदी, मराठी आणि इंग्रजीमध्ये शुक्रवार–गुरुवार च्या ताज्या निवडी",
    "reviews.title": "वापरकर्ता पुनरावलोकने",
    "reviews.postReview": "पुनरावलोकन पोस्ट करा",
    "aiVerdict.title": "त्वरित AI मत",
    "loadMore": "आणखी पाहा",
    "noResults": "या आठवड्यात तुमच्या फिल्टरशी कोणतेही शीर्षक जुळत नाही — शोध थोडा व्यापक करा."
  }
};

export function translate(locale: Locale, key: string): string {
  return TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}
