import sys

def extract_text(pdf_path):
    text_content = ""
    try:
        import PyPDF2
        print("Using PyPDF2")
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text_content += page.extract_text() + "\n"
    except ImportError:
        try:
            import pypdf
            print("Using pypdf")
            with open(pdf_path, 'rb') as f:
                reader = pypdf.PdfReader(f)
                for page in reader.pages:
                    text_content += page.extract_text() + "\n"
        except ImportError:
            print("No suitable PDF library found (PyPDF2, pypdf).")
            return None

    return text_content

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    pdf_path = "pupper files/Pupper project.pdf"
    content = extract_text(pdf_path)
    if content:
        print("--- START CONTENT ---")
        print(content[:5000]) # Print first 5000 chars to avoid overwhelming output
        print("--- END CONTENT ---")
    else:
        print("Failed to extract content.")
