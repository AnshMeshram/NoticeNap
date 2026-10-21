import os
import pymupdf

def generate_samples():
    os.makedirs("samples", exist_ok=True)

    # 1. Rhodes Scholarship Notice
    doc1 = pymupdf.open()
    p1 = doc1.new_page(width=595, height=842)
    p1.insert_text(
        pymupdf.Point(54, 72),
        "THE RHODES SCHOLARSHIP 2025 (INDIA)\n"
        "Trust Memorandum & Official Selection Notice\n\n"
        "1. OVERVIEW\n"
        "The Rhodes Scholarship is the oldest and perhaps most prestigious international scholarship\n"
        "programme, enabling outstanding young people from around the world to study at the\n"
        "University of Oxford.\n\n"
        "2. CRITICAL CALENDAR & DEADLINES\n"
        "- Applications Open: 01 June 2025, 00:01 BST\n"
        "- Final Submission Deadline: 01 August 2025, 23:59 IST (Strict — No extensions)\n"
        "- Longlist Notification: 15 September 2025\n"
        "- Preliminary Interviews: Early October 2025 (Virtual)\n"
        "- Final In-Person Interviews: November 2025 (New Delhi)\n",
        fontsize=11
    )
    p2 = doc1.new_page(width=595, height=842)
    p2.insert_text(
        pymupdf.Point(54, 72),
        "3. ELIGIBILITY CRITERIA\n"
        "- Citizenship: You must be a citizen of India.\n"
        "- Age Benchmark: You must be at least 18 and not yet have reached your 24th birthday on 01 October 2025.\n"
        "- Academic Record: Formal undergraduate degree with First Class Honours or equivalent GPA.\n\n"
        "4. MANDATORY DOCUMENTS CHECKLIST\n"
        "1. Official university academic transcripts with grading key.\n"
        "2. Curriculum Vitae (CV) strictly under 2 pages (no photographs or personal details).\n"
        "3. Personal Statement (1,000 words maximum) outlining personal values and studies.\n"
        "4. Valid Indian Passport identification page.\n"
        "5. Five reference letters (at least 3 academic references).\n\n"
        "5. APPLICATION STEPS\n"
        "- Step 1: Register on the Oxford Rhodes portal at rhodeshouse.ox.ac.uk\n"
        "- Step 2: Upload all documents in single-page or multi-page PDF format (max 5MB each).\n"
        "- Step 3: Verify referee invitations by 25 July 2025.\n",
        fontsize=11
    )
    doc1.save("samples/Rhodes_Scholarship_2025.pdf")
    doc1.close()

    # 2. Civil Services Exam Notice
    doc2 = pymupdf.open()
    cp1 = doc2.new_page(width=595, height=842)
    cp1.insert_text(
        pymupdf.Point(54, 72),
        "UNION PUBLIC SERVICE COMMISSION — EXAMINATION NOTICE NO. 05/2026-CSP\n"
        "CIVIL SERVICES EXAMINATION, 2026\n\n"
        "IMPORTANT DATES & DEADLINES:\n"
        "- Online Applications Open: 14 February 2026\n"
        "- Last Date for Receipt of Applications: 05 March 2026 (till 18:00 Hours)\n"
        "- Prelims Exam Date: 26 May 2026\n"
        "- Mains Exam Schedule: 20 September 2026 to 29 September 2026\n\n"
        "FEE SPECIFICATIONS:\n"
        "- Candidates are required to pay a fee of Rs. 100/- (Rupees One Hundred only).\n"
        "- Female / SC / ST / PwBD candidates are exempted from payment of fee.\n",
        fontsize=11
    )
    cp2 = doc2.new_page(width=595, height=842)
    cp2.insert_text(
        pymupdf.Point(54, 72),
        "ELIGIBILITY CONDITIONS:\n"
        "1. Nationality: A candidate must be a citizen of India for IAS and IPS.\n"
        "2. Age Limits: A candidate must have attained the age of 21 years and must not have attained\n"
        "   the age of 32 years on the 1st of August, 2026.\n"
        "3. Minimum Educational Qualifications: A candidate must hold a Graduate Degree of any of\n"
        "   the Universities incorporated by an Act of the Central or State Legislature in India.\n\n"
        "REQUIRED DOCUMENTS AT OTR PORTAL:\n"
        "- One-Time Registration (OTR) profile with government photo ID proof.\n"
        "- Scanned Photograph (20KB - 50KB, JPG/JPEG format).\n"
        "- Scanned Signature (10KB - 20KB, JPG/JPEG format).\n"
        "- Photo Identity Card (Aadhaar Card/Voter Card/PAN Card/Passport) in PDF (max 1MB).\n",
        fontsize=11
    )
    doc2.save("samples/Civil_Services_Exam_Notice.pdf")
    doc2.close()

    # 3. Research Fellowship PDF
    doc3 = pymupdf.open()
    rp1 = doc3.new_page(width=595, height=842)
    rp1.insert_text(
        pymupdf.Point(54, 72),
        "NATIONAL RESEARCH FELLOWSHIP (NRF) 2026 CALL FOR PROPOSALS\n"
        "Autonomous Science & Humanities Research Council\n\n"
        "SCHEDULE OF RECRUITMENT:\n"
        "- Portal Launch: 01 October 2026\n"
        "- Proposal Submission Deadline: 15 November 2026, 17:00 IST\n"
        "- Technical Peer Review Results: 20 December 2026\n"
        "- Fellowship Tenure Starts: 01 February 2027\n\n"
        "STIPEND & EMOLUMENTS:\n"
        "- Junior Research Fellow (JRF): Rs. 37,000/- per month + HRA as per norms.\n"
        "- Annual Contingency Grant: Rs. 60,000/- per annum for research materials.\n",
        fontsize=11
    )
    doc3.save("samples/Research_Fellowship_PDF.pdf")
    doc3.close()
    print("Sample notices successfully generated in samples/")

if __name__ == "__main__":
    generate_samples()
