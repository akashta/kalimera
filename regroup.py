#!/usr/bin/env python3
"""Reclassify 'general' words into more specific groups and fix one Greek column error."""

import csv

# Maps Greek word → new group.
# Words NOT listed here remain unchanged.
RECLASSIFY = {
    # ── Greek column fix ───────────────────────────────────────────────────────
    # 'ωμέγα ωδείο' is a letter-name prefix error; actual word is 'ωδείο'
    # We only change the group here (fix_translations.py already handles column fixes,
    # but this entry also fixes the greek column inline below)

    # ── names ─────────────────────────────────────────────────────────────────
    'Αγγελική':            'names',
    'Άγγελος':             'names',
    'Αθανασία':            'names',
    'Αθηνά':               'names',
    'Αιμιλία':             'names',
    'Αλεξάνδρα':           'names',
    'Αλέξανδρος':          'names',
    'Αλέξανδρος Μέγας':    'names',
    'Αλέξης':              'names',
    'Αλεξία':              'names',
    'Αλίκη':               'names',
    'Αναστασία':           'names',
    'Ανέστης':             'names',
    'Άννα':                'names',
    'Αννα':                'names',
    'Αντιγόνη':            'names',
    'Αντρέας':             'names',
    'Ανδρέας':             'names',
    'Αντώνης':             'names',
    'Απόστολος':           'names',
    'Αποστόλης':           'names',
    'Αριών':               'names',
    'Άρτεμη':              'names',
    'Βασίλης':             'names',
    'Βασιλική':            'names',
    'Βάσω':                'names',
    'Βίκυ':                'names',
    'Γεράσιμος':           'names',
    'Γιάννης':             'names',
    'Γιώργος':             'names',
    'Γρηγόρης':            'names',
    'Δήμητρα':             'names',
    'Δημήτρης':            'names',
    'Δημήτριος':           'names',
    'Δέσποινα':            'names',
    'Δημητρός':            'names',
    'Ελεγκάκη':            'names',
    'Ελένη':               'names',
    'Ελίνα':               'names',
    'Έλσα':                'names',
    'Ελευθερία':           'names',
    'Ελπίδα':              'names',
    'Ευρυπίδης':           'names',
    'Ζαΐρ':                'names',
    'Ζήσης':               'names',
    'Ηρακλής':             'names',
    'Θανάσης':             'names',
    'Θεόδωρος':            'names',
    'Θωμαή':               'names',
    'Αινστάιν':            'names',
    'Καλλιόπη':            'names',
    'Κάρμεν':              'names',
    'Κατερίνα':            'names',
    'Κάτια':               'names',
    'Κυριάκος':            'names',
    'Κώστας':              'names',
    'Λευτέρης':            'names',
    'Λίτσα':               'names',
    'Λίνκον Αβραάμ':       'names',
    'Λωξάντρα':            'names',
    'Μαίρη':               'names',
    'Μάρθα':               'names',
    'Μαρία':               'names',
    'Μαρίνα':              'names',
    'Μαριάννα':            'names',
    'Μάριος':              'names',
    'Μανόλης':             'names',
    'Μαργαρίτα':           'names',
    'Μιχάλης':             'names',
    'Μίρκα':               'names',
    'Μπάμπης':             'names',
    'Νεκτάριος':           'names',
    'Νίκη':                'names',
    'Νίκος':               'names',
    'Νικολέτα':            'names',
    'Ντίνα':               'names',
    'Όλγα':                'names',
    'Παναγιώτης':          'names',
    'Περσεφόνη':           'names',
    'Πέτρος':              'names',
    'Σαμ':                 'names',
    'Σαίξπηρ Ουίλιαμ':    'names',
    'Σοφία':               'names',
    'Σωτήρης':             'names',
    'Σωτηρία':             'names',
    'Στέλιος':             'names',
    'Τάνια':               'names',
    'Τάσος':               'names',
    'Τασούλα':             'names',
    'Φάμπιο':              'names',
    'Χαράλαμπος':          'names',
    'Χαρίκλεια':           'names',
    'Χριστίνα':            'names',

    # ── colors ────────────────────────────────────────────────────────────────
    'άσπρος':              'colors',
    'λευκός':              'colors',
    'μαύρος':              'colors',
    'γκρι':                'colors',
    'γκρίζος':             'colors',
    'σταχτής':             'colors',
    'κόκκινος':            'colors',
    'κίτρινος':            'colors',
    'πράσινος':            'colors',
    'πράσινο':             'colors',
    'καταπράσινος':        'colors',
    'λαχανί':              'colors',
    'μπλε':                'colors',
    'γαλανός':             'colors',
    'μοβ':                 'colors',
    'μωβ':                 'colors',
    'βιολετής':            'colors',
    'βιολετί':             'colors',
    'ροζ':                 'colors',
    'κοραλλί':             'colors',
    'μπεζ':                'colors',
    'ιβουάρ':              'colors',
    'κρεμ':                'colors',
    'καφέ':                'colors',
    'καστανός':            'colors',
    'λαδί':                'colors',
    'χακί':                'colors',
    'πετρόλ':              'colors',
    'χρυσός':              'colors',
    'ξανθός':              'colors',
    'μελαχρινός':          'colors',
    'χρώμα':               'colors',
    'χρωματιστός':         'colors',
    'πολύχρωμος':          'colors',

    # ── sports ────────────────────────────────────────────────────────────────
    'αθλητής':             'sports',
    'αθλητικός':           'sports',
    'αθλητικά γεγονότα':   'sports',
    'αθλητικοί αγώνες':    'sports',
    'βόλεϊ':               'sports',
    'βουτιά':              'sports',
    'γήπεδο':              'sports',
    'γυμναστήριο':         'sports',
    'γυμναστής':           'sports',
    'γυμναστική':          'sports',
    'ιππασία':             'sports',
    'κανό':                'sports',
    'κολύμπι':             'sports',
    'κολύμβηση':           'sports',
    'κολυμβητήριο':        'sports',
    'κυνήγι':              'sports',
    'ολυμπιακός':          'sports',
    'πιλάτες':             'sports',
    'πισίνα':              'sports',
    'ποδηλάτης':           'sports',
    'τένις':               'sports',
    'τρέξιμο':             'sports',
    'φίλαθλος':            'sports',
    'χιονοδρομικό κέντρο': 'sports',
    'χιονοδρομικός':       'sports',
    'ψάρεμα':              'sports',
    'ψαράς':               'sports',

    # ── music ─────────────────────────────────────────────────────────────────
    'ακορντεόν':           'music',
    'βιολί':               'music',
    'ενορχήστρωση':        'music',
    'κιθάρα':              'music',
    'μπαλέτο':             'music',
    'μπάντα':              'music',
    'νότα':                'music',
    'ντραμς':              'music',
    'όπερα':               'music',
    'ορχήστρα':            'music',
    'πεντάγραμμο':         'music',
    'πιάνο':               'music',
    'ρεσιτάλ':             'music',
    'ρυθμός':              'music',
    'σοπράνο':             'music',
    'συναυλία':            'music',
    'συνθέτης':            'music',
    'συρτάκι':             'music',
    'τάγκο':               'music',
    'τζάζ':                'music',
    'τραγουδιστής':        'music',
    'χορευτής':            'music',
    'χορογραφία':          'music',
    'χορογράφος':          'music',
    'χορωδία':             'music',
    'ωδείο':               'music',

    # ── health ────────────────────────────────────────────────────────────────
    'ακτινογραφία':        'health',
    'ακτινολόγος':         'health',
    'αλλεργία':            'health',
    'αλλεργικός':          'health',
    'αντιβίωση':           'health',
    'ανάρρωση':            'health',
    'αναρρωτικός':         'health',
    'αναπηρία':            'health',
    'ανθυγιεινός':         'health',
    'ασθένεια':            'health',
    'ασθενοφόρο':          'health',
    'ασπιρίνη':            'health',
    'αϋπνία':              'health',
    'βήχας':               'health',
    'γρίπη':               'health',
    'γυναικολόγος':        'health',
    'δερματολόγος':        'health',
    'δηλητηρίαση':         'health',
    'δηλητηριασμένος':     'health',
    'δηλητήριο':           'health',
    'διαιτολόγος':         'health',
    'ηλεκτροπληξία':       'health',
    'θεραπεία':            'health',
    'θερμίδα':             'health',
    'θερμόμετρο':          'health',
    'ιατρικός':            'health',
    'καρδιολόγος':         'health',
    'καρκίνος':            'health',
    'κλινικός':            'health',
    'μικροβιολόγος':       'health',
    'μικροσκόπιο':         'health',
    'νευρικός':            'health',
    'οδοντίατρος':         'health',
    'ορθοπεδικός':         'health',
    'οφθαλμίατρος':        'health',
    'παιδίατρος':          'health',
    'πνευμονολόγος':       'health',
    'πληγή':               'health',
    'ψυχίατρος':           'health',
    'ψυχολογία':           'health',
    'ψυχολογικός':         'health',
    'ψυχολόγος':           'health',
    'χειρουργός':          'health',

    # ── nature ────────────────────────────────────────────────────────────────
    'αγιόκλημα':           'nature',
    'αγρός':               'nature',
    'αγρότης':             'nature',
    'αγροτικός':           'nature',
    'αμπέλι':              'nature',
    'ανακύκλωση':          'nature',
    'ανακυκλωμένος':       'nature',
    'απόβλητο':            'nature',
    'απορρίμματα':         'nature',
    'αργυροπελεκάνος':     'nature',
    'βυθός':               'nature',
    'γεράνι':              'nature',
    'γλάστρα':             'nature',
    'δασικός':             'nature',
    'ερωδιός':             'nature',
    'ηφαίστιο':            'nature',
    'θαλάσσιος':           'nature',
    'κλαδί':               'nature',
    'κόλπος':              'nature',
    'λιβάδι':              'nature',
    'λίπασμα':             'nature',
    'μόλυνση':             'nature',
    'νανόχηνα':            'nature',
    'οικολογικός':         'nature',
    'παγετώνας':           'nature',
    'πηγάδι':              'nature',
    'σπήλαιο':             'nature',
    'φαράγγι':             'nature',
    'φυτό':                'nature',
    'φύση':                'nature',
    'φυτικός':             'nature',
    'φυτοφάρμακο':         'nature',
    'χαλκόκοτα':           'nature',
    'χωράφι':              'nature',
    'ωκεανός':             'nature',
    'ξηρασία':             'nature',

    # ── numbers → time (existing group) ───────────────────────────────────────
    'δέκατος':             'time',
    'δεκατρείς':           'time',
    'δεκατέσσερις':        'time',
    'δεκαπέντε':           'time',
    'δεκαέξι':             'time',
    'δεκαεπτά':            'time',
    'δεκαοκτώ':            'time',
    'δεκαεννιά':           'time',
    'δώδεκα':              'time',
    'έβδομος':             'time',
    'έκτος':               'time',
    'έντεκα':              'time',
    'ένατος':              'time',
    'εξήντα':              'time',
    'εβδομήντα':           'time',
    'εκατομμύριο':         'time',
    'δισεκατομμύριο':      'time',
    'μηδέν':               'time',
    'ογδόντα':             'time',
    'όγδοος':              'time',
    'πέμπτος':             'time',
    'τέταρτος':            'time',
    'τρίτος':              'time',
    'χιλιάδα':             'time',
}

GREEK_COLUMN_FIXES = {
    'ωμέγα ωδείο': 'ωδείο',
}


def regroup(input_file, output_file):
    rows = []
    with open(input_file, encoding='utf-8') as f:
        rows = list(csv.reader(f))

    changed = 0
    greek_fixed = 0
    group_counts: dict[str, int] = {}

    for i, row in enumerate(rows):
        if i == 0 or len(row) < 6:
            continue
        greek = row[1]

        # Fix Greek column errors first
        if greek in GREEK_COLUMN_FIXES:
            row[1] = GREEK_COLUMN_FIXES[greek]
            greek = row[1]
            greek_fixed += 1

        if greek in RECLASSIFY:
            new_group = RECLASSIFY[greek]
            if row[5] != new_group:
                row[5] = new_group
                changed += 1
                group_counts[new_group] = group_counts.get(new_group, 0) + 1

    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        csv.writer(f).writerows(rows)

    print(f'Greek column fixes: {greek_fixed}')
    print(f'Group changes: {changed}')
    for g, c in sorted(group_counts.items()):
        print(f'  → {g}: {c} words')


if __name__ == '__main__':
    regroup('words.csv', 'words.csv')

    # Print final group sizes
    import collections
    with open('words.csv', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        counts = collections.Counter(row[5] for row in reader if len(row) > 5)
    print('\nFinal group sizes:')
    for g, c in sorted(counts.items(), key=lambda x: -x[1]):
        print(f'  {c:5d}  {g}')
