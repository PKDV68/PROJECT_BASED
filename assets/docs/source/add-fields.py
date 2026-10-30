"""Makes a built PDF fillable: adds a form field over every box, tick box and signature line.

Called by build-pdfs.ps1 as:  python add-fields.py <file.pdf> <fields.json>
The JSON comes from document.js (positions in mm from each page's top left). Needs pypdf: python -m pip install pypdf
"""
import json
import sys

from pypdf import PdfReader, PdfWriter
from pypdf.generic import (ArrayObject, BooleanObject, DecodedStreamObject, DictionaryObject, FloatObject,
                           NameObject, NumberObject, TextStringObject)

PT = 72 / 25.4  # mm -> PDF points
RED = "0.784 0.063 0.18"  # site accent #C8102E


def font(base):
    return DictionaryObject({NameObject("/Type"): NameObject("/Font"), NameObject("/Subtype"): NameObject("/Type1"),
                             NameObject("/BaseFont"): NameObject(base)})


def stream(writer, content, w, h, resources=None):
    s = DecodedStreamObject()
    s.set_data(content.encode("latin-1"))
    s.update({NameObject("/Type"): NameObject("/XObject"), NameObject("/Subtype"): NameObject("/Form"),
              NameObject("/BBox"): ArrayObject([FloatObject(0), FloatObject(0), FloatObject(w), FloatObject(h)])})
    if resources:
        s[NameObject("/Resources")] = resources
    return writer._add_object(s)


def main(pdf_path, json_path):
    fields = json.load(open(json_path, encoding="utf-8"))
    writer = PdfWriter(clone_from=PdfReader(pdf_path))
    helv, zadb = writer._add_object(font("/Helvetica")), writer._add_object(font("/ZapfDingbats"))
    acro_fields = ArrayObject()

    for f in fields:
        page = writer.pages[f["page"]]
        page_h = float(page.mediabox.height)
        x, w, h = f["x"] * PT, f["w"] * PT, f["h"] * PT
        y = page_h - f["y"] * PT - h
        widget = DictionaryObject({
            NameObject("/Type"): NameObject("/Annot"), NameObject("/Subtype"): NameObject("/Widget"),
            NameObject("/Rect"): ArrayObject([FloatObject(x), FloatObject(y), FloatObject(x + w), FloatObject(y + h)]),
            NameObject("/T"): TextStringObject(f["name"]), NameObject("/F"): NumberObject(4),  # print
            NameObject("/P"): page.indirect_reference,
            NameObject("/MK"): DictionaryObject({NameObject("/CA"): TextStringObject("4")}),  # no border or fill: the box drawn in the PDF shows through
        })
        if f["type"] == "check":
            # the tick is drawn as a red vector check mark, so it shows in every viewer without a font
            on = stream(writer, f"q {RED} RG {w * 0.13:.2f} w 1 J 1 j {w * 0.22:.2f} {h * 0.52:.2f} m {w * 0.42:.2f} {h * 0.28:.2f} l "
                                f"{w * 0.8:.2f} {h * 0.76:.2f} l S Q", w, h)
            off = stream(writer, "", w, h)
            widget.update({
                NameObject("/FT"): NameObject("/Btn"), NameObject("/V"): NameObject("/Off"), NameObject("/AS"): NameObject("/Off"),
                NameObject("/AP"): DictionaryObject({NameObject("/N"): DictionaryObject({NameObject("/Yes"): on, NameObject("/Off"): off})}),
                NameObject("/DA"): TextStringObject(f"/ZaDb 0 Tf {RED} rg"),
            })
        else:
            size = 10
            widget.update({
                NameObject("/FT"): NameObject("/Tx"), NameObject("/V"): TextStringObject(""),
                NameObject("/DA"): TextStringObject(f"/Helv {size} Tf 0.106 0.106 0.122 rg"),
                NameObject("/Q"): NumberObject(0),
            })
            if f["multiline"]:
                widget[NameObject("/Ff")] = NumberObject(4096)
        ref = writer._add_object(widget)
        page.setdefault(NameObject("/Annots"), ArrayObject()).append(ref)
        acro_fields.append(ref)

    writer._root_object[NameObject("/AcroForm")] = DictionaryObject({
        NameObject("/Fields"): acro_fields,
        NameObject("/NeedAppearances"): BooleanObject(True),  # viewers draw the typed text themselves
        NameObject("/DA"): TextStringObject("/Helv 0 Tf 0 g"),
        NameObject("/DR"): DictionaryObject({NameObject("/Font"): DictionaryObject({NameObject("/Helv"): helv, NameObject("/ZaDb"): zadb})}),
    })
    with open(pdf_path, "wb") as out:
        writer.write(out)
    print(f"  {len(fields)} fillable fields")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
