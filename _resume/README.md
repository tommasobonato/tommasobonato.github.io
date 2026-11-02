# Public Resume

This source builds the downloadable website resume. It contains email and website contact details only.

From the repository root:

```bash
mkdir -p /tmp/website-public-resume
(cd _resume && pdflatex -halt-on-error -interaction=nonstopmode -jobname=ResumeBonato_Web -output-directory=/tmp/website-public-resume main.tex)
cp /tmp/website-public-resume/ResumeBonato_Web.pdf assets/pdf/ResumeBonato_Web.pdf
```

The underscore directory keeps the source and supporting assets out of Jekyll's published pages.
