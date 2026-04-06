import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORDS_PATH = ROOT / "words.csv"

ARTICLE_SET = {
    "ο",
    "η",
    "το",
    "οι",
    "τα",
    "ο/η",
    "η/ο",
    "το/τα",
    "ο/η/το",
    "οι/τα",
    "η/οι",
    "ο/οι",
    "ο/η/οι",
    "ο/το",
    "το/ο",
}

NOUN_LIKE_NUMERAL_IDS = {"801", "2810", "2952", "4662"}

SPECIAL_EXAMPLES = {
    "17": "Ο άγνωστος μου μίλησε στον δρόμο.",
    "81": "Έλα αμέσως, σε περιμένω.",
    "108": "Ο δρόμος είναι ανοιχτός όλη μέρα.",
    "535": "Θα έρθω αύριο το πρωί.",
    "777": "Θα τα πούμε μεθαύριο.",
    "1088": "Πρέπει να φύγω τώρα.",
    "1203": "Ζητώ συγγνώμη για το λάθος.",
    "1281": "Το πήρα τζάμπα από έναν φίλο.",
    "1511": "Δουλεύει ανάλογα με τον καιρό.",
    "1512": "Κάθεται αναπαυτικά στον καναπέ.",
    "1608": "Μίλησαν διαδοχικά όλοι οι μαθητές.",
    "1634": "Τον ξέρω εδώ και πολύ καιρό.",
    "1665": "Ο φίλος μου είναι ελεύθερος αυτόν τον καιρό.",
    "1706": "Και οι δύο ήρθαν στη γιορτή.",
    "1707": "Δύσκολα το πιστεύω αυτό.",
    "1755": "Ιδιαίτερα το καλοκαίρι, μου αρέσει η θάλασσα.",
    "1766": "Αυτόν τον καιρό δουλεύω πολύ.",
    "1870": "Περίμενε λίγο ακόμα.",
    "1878": "Το μάθημα είναι στις τρεις μ.μ.",
    "1987": "Το ραντεβού είναι στις δέκα π.μ.",
    "1996": "Ο αδελφός μου είναι παντρεμένος.",
    "2019": "Ήρθαν περίπου στις οκτώ.",
    "2057": "Έφυγε πριν από λίγο.",
    "2089": "Ο σερβιτόρος φέρνει τον καφέ.",
    "2106": "Πηγαίνω σπάνια στο σινεμά.",
    "2152": "Μιλήσαμε σχετικά με το θέμα.",
    "2155": "Το έγραψες σωστά.",
    "2171": "Το είδα στην τηλεόραση χτες.",
    "2199": "Ο φίλος μου μένει κοντά μας.",
    "2203": "Ο φοιτητής διαβάζει για τις εξετάσεις.",
    "2244": "Ο χορευτής είναι στη σκηνή.",
    "2250": "Είναι χωρισμένος εδώ και χρόνια.",
    "2376": "Κάθισε άνετα δίπλα μου.",
    "2469": "Μίλησε απειλητικά στον οδηγό.",
    "2698": "Τον χειμώνα βραδιάζει νωρίς.",
    "2810": "Η δεκάδα είναι σημαντική στο σκορ.",
    "2945": "Ειδικά σήμερα, έχω πολλή δουλειά.",
    "3031": "Εντάξει, ας προχωρήσουμε.",
    "3306": "Θα έρθω σε λίγο καιρό ξανά.",
    "3398": "Το σπίτι είναι κεντρικά στην πόλη.",
    "3662": "Το είπε μεταφορικά, όχι κυριολεκτικά.",
    "3833": "Το σκέφτεται οικονομικά πριν αγοράσει κάτι.",
    "3932": "Δουλεύει και παράλληλα σπουδάζει.",
    "4075": "Είναι πολύ ταξιδεμένος και ξέρει πολλές χώρες.",
    "4173": "Το ρακόμελο είναι ζεστό τον χειμώνα.",
    "4342": "Μιλώ συγκεκριμένα για αυτό το θέμα.",
    "4384": "Στη συνέχεια πήγα σπίτι.",
}

DRINK_KEYWORDS = {
    "coffee",
    "tea",
    "water",
    "juice",
    "wine",
    "beer",
    "milk",
    "ouzo",
    "tsipouro",
    "drink",
    "raki",
    "cocktail",
    "champagne",
    "whisky",
    "whiskey",
    "vodka",
}
PLACE_KEYWORDS = {
    "city",
    "town",
    "village",
    "country",
    "island",
    "sea",
    "ocean",
    "station",
    "airport",
    "port",
    "square",
    "mountain",
    "beach",
    "hotel",
    "museum",
    "office",
    "school",
    "hospital",
    "church",
}
PERSON_KEYWORDS = {
    "person",
    "man",
    "woman",
    "boy",
    "girl",
    "brother",
    "sister",
    "friend",
    "student",
    "teacher",
    "doctor",
    "waiter",
    "server",
    "athlete",
    "tourist",
    "manager",
    "director",
    "winner",
    "speaker",
    "reader",
    "translator",
    "candidate",
    "judge",
    "scientist",
    "merchant",
    "guide",
    "relative",
    "witness",
    "dancer",
    "singer",
    "pharmacist",
    "baker",
    "supervisor",
    "resident",
    "inhabitant",
}
PROFESSION_KEYWORDS = {
    "teacher",
    "doctor",
    "manager",
    "director",
    "waiter",
    "translator",
    "reader",
    "judge",
    "scientist",
    "merchant",
    "guide",
    "pharmacist",
    "baker",
    "supervisor",
    "director",
    "speaker",
    "trainer",
    "athlete",
    "dancer",
    "singer",
}
MOVEMENT_KEYWORDS = {
    "go",
    "come",
    "leave",
    "arrive",
    "return",
    "travel",
    "walk",
    "run",
    "climb",
    "enter",
    "reach",
    "move",
}
COMMUNICATION_KEYWORDS = {
    "say",
    "tell",
    "speak",
    "talk",
    "read",
    "write",
    "ask",
    "answer",
    "call",
    "translate",
    "listen",
}
HOME_ACTION_KEYWORDS = {
    "cook",
    "clean",
    "wash",
    "open",
    "close",
    "gather",
    "water",
    "fix",
    "cut",
    "paint",
    "carry",
}
MENTAL_KEYWORDS = {
    "know",
    "understand",
    "remember",
    "forget",
    "think",
    "believe",
    "love",
    "like",
    "prefer",
    "want",
    "need",
}
PERSON_ADJECTIVE_KEYWORDS = {
    "immature",
    "careful",
    "friendly",
    "honest",
    "polite",
    "kind",
    "serious",
    "funny",
    "strange",
    "brave",
    "calm",
    "angry",
    "happy",
    "sad",
    "tired",
    "ready",
    "free",
    "married",
    "single",
    "divorced",
    "young",
    "old",
    "pregnant",
    "retired",
}
MATERIAL_ADJECTIVE_KEYWORDS = {
    "paper",
    "wooden",
    "plastic",
    "metal",
    "glass",
    "cotton",
    "wool",
    "silk",
    "leather",
    "stone",
    "gold",
    "silver",
    "iron",
}

PRONOUN_EXAMPLES = {
    "αυτός": "Αυτός μένει εδώ.",
    "εσύ": "Εσύ μένεις εδώ;",
    "καθένας": "Καθένας έχει τη θέση του.",
    "κανένας": "Δεν είναι κανένας εδώ.",
    "κάποιος": "Κάποιος χτυπάει την πόρτα.",
    "κάτι": "Βλέπω κάτι στο τραπέζι.",
    "οποίος": "Ο άνθρωπος, ο οποίος μιλάει, είναι φίλος μου.",
    "όποιος": "Όποιος θέλει, έρχεται μαζί μας.",
    "οποιοσδήποτε": "Οποιοσδήποτε μπορεί να βοηθήσει.",
    "τίνος": "Τίνος είναι αυτό το βιβλίο;",
    "ποιος": "Ποιος είναι στην πόρτα;",
    "που": "Το παιδί που μιλάει είναι ο αδελφός μου.",
    "τι": "Τι θέλεις τώρα;",
    "τίποτα": "Δεν βλέπω τίποτα εδώ.",
    "αυτοί": "Αυτοί μένουν κοντά μας.",
    "εαυτός": "Πρέπει να προσέχεις τον εαυτό σου.",
    "εγώ": "Εγώ μένω εδώ.",
    "εκείνον": "Βλέπω εκείνον στην πόρτα.",
    "εμείς": "Εμείς μένουμε εδώ.",
    "εσένα": "Βλέπω εσένα, όχι εκείνον.",
    "όσα": "Πάρε όσα θέλεις.",
    "όσος": "Φάε όσο θέλεις.",
    "ποιανού": "Ποιανού είναι αυτό το αυτοκίνητο;",
}

PREPOSITION_EXAMPLES = {
    "ανάμεσα": "Το σπίτι είναι ανάμεσα στα δέντρα.",
    "απέναντι": "Το καφέ είναι απέναντι από την τράπεζα.",
    "από": "Είμαι από την Κύπρο.",
    "για": "Φεύγω για το σπίτι.",
    "δίπλα": "Το φαρμακείο είναι δίπλα στο σχολείο.",
    "κάτω από": "Η γάτα είναι κάτω από το τραπέζι.",
    "με": "Πάω με το λεωφορείο.",
    "μέσασε": "Το γάλα είναι μέσα σε ένα ποτήρι.",
    "μετά": "Θα τα πούμε μετά το μάθημα.",
    "μέχρι": "Δουλεύω μέχρι αργά.",
    "πάνω σε": "Το βιβλίο είναι πάνω σε ένα τραπέζι.",
    "πριν (από)": "Έφυγα πριν από λίγο.",
    "προς": "Πηγαίνω προς το σπίτι.",
    "σαν": "Μιλάει σαν παιδί.",
    "σε": "Είμαι σε ένα καφέ.",
    "σύμφωνα": "Σύμφωνα με τον γιατρό, είναι καλά.",
    "χωρίς": "Έφυγε χωρίς ομπρέλα.",
    "ως": "Δουλεύει ως δάσκαλος.",
    "από μέσα": "Μας μίλησε από μέσα.",
    "έξω από": "Το παιδί παίζει έξω από το σπίτι.",
    "μαζί με": "Ήρθε μαζί με τον αδελφό του.",
    "μέσα σε": "Το γάλα είναι μέσα σε ένα ποτήρι.",
    "μπροστά από": "Το αυτοκίνητο είναι μπροστά από το σπίτι.",
    "πριν": "Έφτασα πριν από όλους.",
    "σε σχέση με": "Είναι καλύτερο σε σχέση με πέρσι.",
    "αντί": "Πήρα τσάι αντί για καφέ.",
    "δίχως": "Έφυγε δίχως ομπρέλα.",
    "εξαιτίας": "Έφυγε εξαιτίας της βροχής.",
    "για το δικό σας καλό": "Σας το λέω για το δικό σας καλό.",
    "μεταξύ": "Το σπίτι είναι μεταξύ δύο δρόμων.",
}

PARTICLE_EXAMPLES = {
    "καθόλου": "Δεν πεινάω καθόλου.",
    "ναι": "Ναι, φυσικά.",
    "όποτε": "Έλα όποτε θέλεις.",
    "όχι": "Όχι, δεν θέλω.",
    "πια": "Δεν μένει εδώ πια.",
    "ας": "Ας πάμε τώρα.",
    "να": "Να το κλειδί σου.",
    "έτσι κι έτσι": "Σήμερα είμαι έτσι κι έτσι.",
    "λογιών λογιών": "Έχει λογιών λογιών φρούτα.",
    "λοιπόν": "Λοιπόν, πάμε τώρα.",
}

PHRASE_EXAMPLES = {
    "επιτρέπεται": "Επιτρέπεται να μπω;",
    "κάνει ζέστη": "Σήμερα κάνει ζέστη.",
    "τι καιρό κάνει;": "Τι καιρό κάνει σήμερα;",
    "πώς σε λένε;": "Πώς σε λένε;",
    "Φυσάει": "Σήμερα φυσάει πολύ.",
    "χιονίζει": "Στο βουνό χιονίζει.",
    "Πόσων χρονών είσαι;": "Πόσων χρονών είσαι;",
    "Η ώρα είναι τέσσερις": "Η ώρα είναι τέσσερις και φεύγω.",
    "Η ώρα είναι τεσσερισήμισι": "Η ώρα είναι τεσσερισήμισι τώρα.",
    "Αληθώς Ανέστη!": "Χριστός Ανέστη! Αληθώς Ανέστη!",
    "βρέχει": "Έξω βρέχει πολύ.",
    "διασκέδαση!": "Καλή διασκέδαση!",
    "Να τα εκατοστήσεις!": "Γιάννη, να τα εκατοστήσεις!",
    "δύο φορές": "Το είπα δύο φορές.",
    "καλή επιτυχία!": "Καλή επιτυχία στις εξετάσεις!",
    "να ζήσετε!": "Να ζήσετε και να είστε πάντα χαρούμενοι!",
    "έχει ήλιο": "Σήμερα έχει ήλιο.",
    "καλές γιορτές!": "Καλές γιορτές σε όλους!",
    "Καλό Πάσχα!": "Καλό Πάσχα σε όλους!",
    "Καλή Ανάσταση!": "Καλή Ανάσταση σε όλους!",
    "πόσο κάνει;": "Πόσο κάνει αυτό;",
    "κάνει": "Σήμερα κάνει κρύο.",
    "μ.μ.": "Το ραντεβού είναι στις πέντε μ.μ.",
    "με λένε": "Με λένε Νίκο.",
    "θα είμαι πίσω": "Μην ανησυχείς, θα είμαι πίσω.",
    "από πού είσαι;": "Από πού είσαι;",
    "έχει συννεφιά": "Σήμερα έχει συννεφιά.",
    "τ.μ.": "Το σπίτι είναι ογδόντα τ.μ.",
    "Χριστός Ανέστη!": "Χριστός Ανέστη! Αληθώς Ανέστη!",
    "χτυπάει το τηλέφωνο": "Περίμενε, χτυπάει το τηλέφωνο.",
    "άνω κάτω": "Το σπίτι είναι άνω κάτω.",
    "αρχές": "Στις αρχές του μήνα θα φύγω.",
    "Κελσίου (βαθμοί)": "Σήμερα έχει είκοσι βαθμούς Κελσίου.",
    "του φούρνου": "Μου αρέσει το φαγητό του φούρνου.",
    "έχει αέρα": "Σήμερα έχει αέρα.",
}

CONJUNCTION_EXAMPLES = {
    "αν": "Αν έχεις χρόνο, έλα.",
    "και": "Μιλάει και γράφει καλά.",
    "αλλά": "Θέλω να έρθω, αλλά δεν μπορώ.",
    "αφού": "Αφού τελείωσες, έλα εδώ.",
    "εφόσον": "Εφόσον έχεις χρόνο, έλα μαζί μας.",
    "καθώς": "Καθώς περπατούσαμε, μιλούσαμε.",
    "όμως": "Θέλω να έρθω, όμως δεν μπορώ.",
    "όπως": "Κάνε το όπως σου είπα.",
    "ώστε": "Μίλα δυνατά, ώστε να σε ακούμε.",
    "ωστόσο": "Ήταν αργά, ωστόσο έμεινε.",
    "επειδή": "Έμεινα σπίτι επειδή βρέχει.",
    "μα": "Θα έρθω, μα θα αργήσω.",
    "μήπως": "Μήπως θέλεις καφέ;",
    "ότι": "Νομίζω ότι έχει δίκιο.",
    "αν και": "Αν και κουρασμένος, συνέχισε.",
    "ενώ": "Εκείνος διαβάζει, ενώ εγώ γράφω.",
    "έστω": "Έστω και αργά, ήρθε.",
    "μολονότι": "Μολονότι κουρασμένος, χαμογελούσε.",
    "ούτε": "Δεν μιλάει ούτε γελάει.",
    "παρόλο που": "Παρόλο που βρέχει, βγήκαμε.",
}

INTERJECTION_EXAMPLES = {
    "γεια!": "Γεια! Τι κάνεις;",
    "ευχαριστώ!": "Ευχαριστώ πολύ.",
    "κρίμα!": "Κρίμα! Δεν μπορώ να έρθω.",
    "μπράβο!": "Μπράβο! Τα πήγες πολύ καλά.",
    "ορίστε!": "Ορίστε, ο καφές σας.",
    "σας παρακαλώ!": "Σας παρακαλώ, καθίστε.",
    "συγνώμη!": "Συγνώμη, άργησα.",
    "Φυσικά!": "Φυσικά! Θα έρθω.",
    "Χάρηκα που σας γνώρισα!": "Χάρηκα που σας γνώρισα!",
    "γεια": "Γεια! Τι κάνεις;",
    "ευτυχισμένος ο καινούριος χρόνος!": "Ευτυχισμένος ο καινούριος χρόνος!",
    "καλή χρονιά!": "Καλή χρονιά σε όλους!",
    "καλή όρεξη!": "Καλή όρεξη!",
    "περαστικά!": "Περαστικά! Να γίνεις καλά.",
    "συγγνώμη!": "Συγγνώμη, δεν το ήξερα.",
    "χαίρετε": "Χαίρετε, τι θα θέλατε;",
    "χρόνια πολλά!": "Χρόνια πολλά και ό,τι θέλεις!",
}

VERB_EXAMPLES = {
    "ζω": "Ζω στην πόλη.",
    "στύβω": "Στύβω το πορτοκάλι το πρωί.",
    "αφιερώνω": "Αφιερώνω χρόνο στο παιδί μου.",
    "καίω": "Καίω ξύλα στο τζάκι.",
    "κάνω μπάνιο": "Κάνω μπάνιο το πρωί.",
    "διαγωνίζομαι": "Αύριο διαγωνίζομαι στο σχολείο.",
    "λάμπω": "Λάμπω από χαρά σήμερα.",
    "μετακινώ": "Μετακινώ το τραπέζι λίγο.",
    "μεταφέρω": "Μεταφέρω τα πράγματα στο σπίτι.",
    "νοστιμεύω": "Νοστιμεύω το φαγητό με λεμόνι.",
    "πνέω": "Πνέω αργά και ήρεμα.",
    "σχηματίζω": "Σχηματίζω έναν κύκλο.",
    "ταλαιπωρούμαι": "Τον τελευταίο καιρό ταλαιπωρούμαι πολύ.",
    "φανερώνω": "Φανερώνω την αλήθεια.",
    "αγκαλιάζω": "Αγκαλιάζω τη μητέρα μου.",
    "κλειδώνω": "Κλειδώνω την πόρτα κάθε βράδυ.",
}

ADJECTIVE_EXAMPLES = {
    "ανώριμος": "Ο αδελφός μου είναι ανώριμος.",
    "γυναικείος": "Ο ρόλος είναι γυναικείος.",
    "ελαφρύς": "Ο σάκος είναι ελαφρύς.",
    "επιπλωμένος": "Ο χώρος είναι επιπλωμένος.",
    "καινούριος": "Ο υπολογιστής είναι καινούριος.",
    "κατάλληλος": "Ο χώρος είναι κατάλληλος.",
    "κρύος": "Ο καιρός είναι κρύος.",
    "τουριστικός": "Ο τόπος είναι τουριστικός.",
    "δημοτικός": "Ο κήπος είναι δημοτικός.",
    "χάρτινος": "Ο φάκελος είναι χάρτινος.",
}


def normalize_space(text: str) -> str:
    return " ".join(text.split())


def split_forms(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"\s*/\s*", text) if part.strip()]


def starts_with_article(text: str) -> bool:
    first = text.split(" ", 1)[0]
    return first in ARTICLE_SET


def article_and_remainder(text: str) -> tuple[str | None, str]:
    parts = normalize_space(text).split(" ", 1)
    if parts[0] in ARTICLE_SET and len(parts) > 1:
        return parts[0], parts[1]
    return None, normalize_space(text)


def simplify_article(article: str | None) -> str | None:
    if article is None:
        return None
    return split_forms(article)[0]


def primary_noun_phrase(greek: str) -> tuple[str | None, str]:
    article, remainder = article_and_remainder(greek)
    simple_article = simplify_article(article)
    if "/" in remainder:
        remainder = split_forms(remainder)[0]
    tokens = remainder.split()
    if len(tokens) == 2 and all(token and token[0].islower() for token in tokens):
        remainder = tokens[0]
    if simple_article:
        return simple_article, normalize_space(f"{simple_article} {remainder}")
    return None, normalize_space(remainder)


def adjective_profile(form: str) -> str:
    token = normalize_space(form).split()[0]
    if token.endswith(("οι", "ές")):
        return "plural_people"
    if token.endswith(("α", "ια")) and len(token) > 3:
        return "plural_neuter"
    if token.endswith(("η", "ή")):
        return "feminine"
    if token.endswith(("ο", "ό", "ι", "ύ")):
        return "neuter"
    return "masculine"


def agree(article: str | None, masculine: str, feminine: str, neuter: str, plural_people: str | None = None, plural_neuter: str | None = None) -> str:
    if article == "ο":
        return masculine
    if article == "η":
        return feminine
    if article == "το":
        return neuter
    if article in {"οι", "ο/οι"}:
        return plural_people or masculine
    if article in {"τα", "το/τα", "οι/τα"}:
        return plural_neuter or neuter
    if article in {"ο/η", "ο/η/το", "ο/η/οι"}:
        return masculine
    return neuter


def subject_for_adjective(profile: str, group: str, english: str) -> str:
    low = english.lower()
    if any(keyword in low for keyword in PERSON_ADJECTIVE_KEYWORDS):
        mapping = {
            "masculine": "Ο φίλος μου",
            "feminine": "Η φίλη μου",
            "neuter": "Το παιδί",
            "plural_people": "Οι άνθρωποι",
            "plural_neuter": "Τα παιδιά",
        }
        return mapping[profile]
    if any(keyword in low for keyword in MATERIAL_ADJECTIVE_KEYWORDS):
        mapping = {
            "masculine": "Ο φάκελος",
            "feminine": "Η τσάντα",
            "neuter": "Το ποτήρι",
            "plural_people": "Οι τσάντες",
            "plural_neuter": "Τα ποτήρια",
        }
        return mapping[profile]
    if any(keyword in low for keyword in {"women's", "feminine", "men's", "masculine"}):
        mapping = {
            "masculine": "Ο ρόλος",
            "feminine": "Η μπλούζα",
            "neuter": "Το ρούχο",
            "plural_people": "Οι ρόλοι",
            "plural_neuter": "Τα ρούχα",
        }
        return mapping[profile]
    if group == "food":
        mapping = {
            "masculine": "Ο καφές",
            "feminine": "Η σαλάτα",
            "neuter": "Το φαγητό",
            "plural_people": "Οι γεύσεις",
            "plural_neuter": "Τα φαγητά",
        }
        return mapping[profile]
    if group in {"colors", "clothes"}:
        mapping = {
            "masculine": "Ο τοίχος",
            "feminine": "Η μπλούζα",
            "neuter": "Το φόρεμα",
            "plural_people": "Οι κάλτσες",
            "plural_neuter": "Τα ρούχα",
        }
        return mapping[profile]
    if any(keyword in low for keyword in {"married", "single", "divorced", "retired", "pregnant", "elderly", "old", "young"}):
        mapping = {
            "masculine": "Ο άνθρωπος",
            "feminine": "Η γυναίκα",
            "neuter": "Το παιδί",
            "plural_people": "Οι άνθρωποι",
            "plural_neuter": "Τα παιδιά",
        }
        return mapping[profile]
    if group in {"people", "descriptions", "society"}:
        mapping = {
            "masculine": "Ο φίλος μου",
            "feminine": "Η φίλη μου",
            "neuter": "Το παιδί",
            "plural_people": "Οι άνθρωποι",
            "plural_neuter": "Τα παιδιά",
        }
        return mapping[profile]
    if group in {"space", "city", "travel", "weather", "countries", "geography"}:
        mapping = {
            "masculine": "Ο δρόμος",
            "feminine": "Η περιοχή",
            "neuter": "Το μέρος",
            "plural_people": "Οι δρόμοι",
            "plural_neuter": "Τα μέρη",
        }
        return mapping[profile]
    if group in {"home", "technology", "school"}:
        mapping = {
            "masculine": "Ο χώρος",
            "feminine": "Η αίθουσα",
            "neuter": "Το σπίτι",
            "plural_people": "Οι χώροι",
            "plural_neuter": "Τα σπίτια",
        }
        return mapping[profile]
    if group in {"objects", "home", "technology", "school", "travel", "city"}:
        mapping = {
            "masculine": "Ο υπολογιστής",
            "feminine": "Η πόρτα",
            "neuter": "Το σπίτι",
            "plural_people": "Οι δρόμοι",
            "plural_neuter": "Τα πράγματα",
        }
        return mapping[profile]
    if group in {"concepts", "communication", "feelings"}:
        mapping = {
            "masculine": "Ο τρόπος",
            "feminine": "Η ιδέα",
            "neuter": "Το θέμα",
            "plural_people": "Οι λέξεις",
            "plural_neuter": "Τα νέα",
        }
        return mapping[profile]
    mapping = {
        "masculine": "Ο φίλος μου",
        "feminine": "Η μέρα",
        "neuter": "Το σπίτι",
        "plural_people": "Οι άνθρωποι",
        "plural_neuter": "Τα πράγματα",
    }
    return mapping[profile]


def is_person_like(group: str, english: str) -> bool:
    if group in {"people", "professions", "names"}:
        return True
    low = english.lower()
    return any(keyword in low for keyword in PERSON_KEYWORDS)


def noun_example(row: dict[str, str]) -> str:
    article, subject = primary_noun_phrase(row["greek"])
    low = row["english"].lower()
    group = row["group"]

    if row["id"] in NOUN_LIKE_NUMERAL_IDS:
        return f"{subject} είναι σημαντικό."

    if group == "names":
        return f"{subject} μένει κοντά μας."

    if is_person_like(group, low):
        if any(keyword in low for keyword in PROFESSION_KEYWORDS):
            return f"{subject} δουλεύει σήμερα."
        return f"{subject} μένει κοντά μας."

    if group in {"sports", "music", "leisure", "holidays"}:
        return f"Μου αρέσει {subject}."

    if group == "food":
        if any(keyword in low for keyword in DRINK_KEYWORDS):
            predicate = agree(article, "ζεστός", "ζεστή", "ζεστό", "ζεστοί", "ζεστά")
            return f"{subject} είναι {predicate}."
        predicate = agree(article, "νόστιμος", "νόστιμη", "νόστιμο", "νόστιμοι", "νόστιμα")
        return f"{subject} είναι {predicate}."

    if group in {"countries", "geography", "city", "travel", "weather", "nature"} or any(keyword in low for keyword in PLACE_KEYWORDS):
        predicate = agree(article, "όμορφος", "όμορφη", "όμορφο", "όμορφοι", "όμορφα")
        return f"{subject} είναι {predicate}."

    if group == "animals":
        predicate = agree(article, "ήσυχος", "ήσυχη", "ήσυχο", "ήσυχοι", "ήσυχα")
        return f"{subject} είναι {predicate}."

    if group == "body":
        predicate = agree(article, "σημαντικός", "σημαντική", "σημαντικό", "σημαντικοί", "σημαντικά")
        return f"{subject} είναι {predicate} για το σώμα."

    if group in {"concepts", "communication", "feelings", "society", "money", "time"}:
        predicate = agree(article, "σημαντικός", "σημαντική", "σημαντικό", "σημαντικοί", "σημαντικά")
        return f"{subject} είναι {predicate}."

    if group in {"objects", "home", "clothes", "technology", "school"}:
        predicate = agree(article, "χρήσιμος", "χρήσιμη", "χρήσιμο", "χρήσιμοι", "χρήσιμα")
        return f"{subject} είναι {predicate}."

    predicate = agree(article, "καλός", "καλή", "καλό", "καλοί", "καλά")
    return f"{subject} είναι {predicate}."


def adjective_example(row: dict[str, str]) -> str:
    form = normalize_space(row["greek"])
    if form in ADJECTIVE_EXAMPLES:
        return ADJECTIVE_EXAMPLES[form]
    if "/" in form:
        form = split_forms(form)[0]
    tokens = form.split()
    if len(tokens) == 2 and all(token and token[0].islower() for token in tokens):
        form = tokens[0]

    profile = adjective_profile(form)
    subject = subject_for_adjective(profile, row["group"], row["english"])
    return f"{subject} είναι {form}."


def verb_example(row: dict[str, str]) -> str:
    form = normalize_space(row["greek"])
    low = row["english"].lower()

    if form in VERB_EXAMPLES:
        return VERB_EXAMPLES[form]
    if any(keyword in low for keyword in {"must", "should"}):
        return "Πρέπει να φύγω τώρα."
    if any(keyword in low for keyword in {"can", "be able"}):
        return "Μπορώ να έρθω αύριο."
    if "love" in low:
        return f"{form} αυτή τη μουσική."
    if "like" in low:
        return f"{form} πολύ αυτό το μέρος."
    if "want" in low:
        return f"{form} λίγο νερό."
    if any(keyword in low for keyword in MOVEMENT_KEYWORDS):
        return f"Σήμερα {form} νωρίς."
    if any(keyword in low for keyword in COMMUNICATION_KEYWORDS):
        return f"Σήμερα {form} με έναν φίλο."
    if any(keyword in low for keyword in HOME_ACTION_KEYWORDS):
        return f"Στο σπίτι {form} κάθε μέρα."
    if any(keyword in low for keyword in MENTAL_KEYWORDS):
        return f"Τώρα {form} καλύτερα."
    if any(keyword in low for keyword in {"buy", "find", "take", "bring", "send"}):
        return f"Σήμερα {form} κάτι μικρό."
    if any(keyword in low for keyword in {"eat", "drink"}):
        return f"Τώρα {form} κάτι καλό."
    return f"Τώρα {form} λίγο."


def adverb_example(row: dict[str, str]) -> str:
    form = normalize_space(row["greek"])
    low = row["english"].lower()

    if "immediately" in low or "right away" in low:
        return f"Έλα {form}, σε περιμένω."
    if "late" in low:
        return f"Ήρθε {form} στο σπίτι."
    if "left" in low or "right" in low or "above" in low or "below" in low or "behind" in low:
        return f"Το βιβλίο είναι {form}."
    if "inside" in low or "outside" in low or "indoors" in low:
        return f"Περίμενε {form}."
    if "comfortably" in low:
        return f"Κάθομαι {form} εδώ."
    if "correctly" in low:
        return f"Το γράφεις {form}."
    if "often" in low:
        return f"Πηγαίνω {form} εκεί."
    if "rarely" in low or "seldom" in low:
        return f"Πηγαίνω {form} στο σινεμά."
    if "especially" in low or "specifically" in low:
        return f"Μου αρέσει {form} αυτό."
    if "accordingly" in low or "depending on" in low:
        return f"Δουλεύει {form} με το πρόγραμμα."
    if "centrally" in low:
        return f"Το σπίτι είναι {form} στην πόλη."
    if "metaphorically" in low or "figuratively" in low:
        return f"Το είπε {form}."
    return f"Μιλάει {form}."


def numeral_example(row: dict[str, str]) -> str:
    low = row["english"].lower()
    if row["id"] in NOUN_LIKE_NUMERAL_IDS or starts_with_article(row["greek"]):
        _, subject = primary_noun_phrase(row["greek"])
        return f"{subject} είναι σημαντικό."
    if any(keyword in low for keyword in {"first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"}):
        return f"Είμαι {row['greek']} στη σειρά."
    return f"Έχω {row['greek']} βιβλία."


def pronoun_example(row: dict[str, str]) -> str:
    form = normalize_space(row["greek"])
    low = row["english"].lower()

    if form in PRONOUN_EXAMPLES:
        return PRONOUN_EXAMPLES[form]
    if "whose" in low:
        return f"{form} είναι αυτό το βιβλίο;"
    if "what" in low:
        return f"{form} θέλεις τώρα;"
    if "who" in low or "which" in low:
        return f"{form} έρχεται μαζί μας;"
    if "something" in low:
        return f"Βλέπω {form} στο τραπέζι."
    if "nothing" in low:
        return f"Δεν βλέπω {form} εδώ."
    if "someone" in low or "anyone" in low or "everyone" in low or "no one" in low:
        return f"{form} με περιμένει έξω."
    if low in {"i", "you", "we", "he, she", "he", "she", "these, they"}:
        return f"{form} είμαστε εδώ."
    if "self" in low:
        return f"Σκέφτομαι τον {form} μου."
    return f"{form} είναι εδώ."


def preposition_example(row: dict[str, str]) -> str:
    form = normalize_space(row["greek"])
    if form in PREPOSITION_EXAMPLES:
        return PREPOSITION_EXAMPLES[form]
    return f"Το βιβλίο είναι {form} το τραπέζι."


def conjunction_example(row: dict[str, str]) -> str:
    form = normalize_space(row["greek"])
    if form in CONJUNCTION_EXAMPLES:
        return CONJUNCTION_EXAMPLES[form]
    return f"Μιλάει λίγο, {form} καταλαβαίνει πολλά."


def interjection_example(row: dict[str, str]) -> str:
    raw_form = normalize_space(row["greek"])
    if raw_form in INTERJECTION_EXAMPLES:
        return INTERJECTION_EXAMPLES[raw_form]
    form = raw_form.rstrip("!")
    if form == "γεια":
        return "Γεια! Τι κάνεις;"
    if form in {"ευχαριστώ", "σας παρακαλώ"}:
        return f"{form.capitalize()} πολύ."
    return f"{form.capitalize()}!"


def particle_example(row: dict[str, str]) -> str:
    form = normalize_space(row["greek"])
    if form in PARTICLE_EXAMPLES:
        return PARTICLE_EXAMPLES[form]
    if form == "θα":
        return "Θα έρθω αύριο."
    if form == "ναι":
        return "Ναι, φυσικά."
    if form == "όχι":
        return "Όχι, δεν θέλω."
    if form == "ας":
        return "Ας πάμε τώρα."
    return f"{form.capitalize()} το λέμε συχνά."


def phrase_example(row: dict[str, str]) -> str:
    form = normalize_space(row["greek"])
    low = row["english"].lower()
    if form in PHRASE_EXAMPLES:
        return PHRASE_EXAMPLES[form]
    if "long time" in low:
        return f"Τον ξέρω {form}."
    if "moment" in low:
        return f"{form.capitalize()} δουλεύω πολύ."
    if "afterwards" in low or "after that" in low:
        return f"{form.capitalize()} πήγα σπίτι."
    if "once" in low:
        return f"Το λέω {form} μόνο."
    return f"{form.capitalize()} το ακούω συχνά."


def generate_example(row: dict[str, str]) -> str:
    if row["id"] in SPECIAL_EXAMPLES:
        return SPECIAL_EXAMPLES[row["id"]]

    word_type = row["type"]
    if word_type == "noun":
        return noun_example(row)
    if word_type == "adjective":
        return adjective_example(row)
    if word_type == "verb":
        return verb_example(row)
    if word_type == "adverb":
        return adverb_example(row)
    if word_type == "numeral":
        return numeral_example(row)
    if word_type == "pronoun":
        return pronoun_example(row)
    if word_type == "preposition":
        return preposition_example(row)
    if word_type == "conjunction":
        return conjunction_example(row)
    if word_type == "interjection":
        return interjection_example(row)
    if word_type == "particle":
        return particle_example(row)
    if word_type == "phrase":
        return phrase_example(row)
    return normalize_space(row["greek"])


def main() -> None:
    with WORDS_PATH.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
        fieldnames = list(rows[0].keys())

    if "example" not in fieldnames:
        fieldnames.append("example")

    for row in rows:
        row["example"] = generate_example(row)

    with WORDS_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Updated examples for {len(rows)} rows.")


if __name__ == "__main__":
    main()
