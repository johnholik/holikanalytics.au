# -*- coding: utf-8 -*-
"""
Created on Wed Jan 21 17:42:05 2026

@author: johnh
"""

import fitz  # PyMuPDF

# Path to your PDF file
pdf_path = 'szalay_holik_nguyen_morandini_madill_GVS_methods_poster_final_printed.pdf'  # Make sure the file is in the same directory
# Path to save the JPG file
jpg_path = 'szalay_holik_nguyen_morandini_madill_GVS_methods_poster_final_printed.jpg'

# Open the PDF file
pdf_document = fitz.open(pdf_path)

# Select the first page
page = pdf_document[0]

# Render the page to an image with a specific DPI
pix = page.get_pixmap(dpi=300)

# Save the image as JPG
pix.save(jpg_path)

# Clean up
pdf_document.close()