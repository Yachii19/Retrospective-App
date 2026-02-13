import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RetroSession } from '../../models/session.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FeedbackService } from '../../services/feedback.service';


@Component({
  selector: 'app-session-details-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-details-header.component.html',
  styleUrl: './session-details-header.component.scss'
})
export class SessionDetailsHeaderComponent {
  session: RetroSession | null = null;
  sessionId: string = '';
  membersCount: number = 0;
  creator: boolean = false;
  user: User | null = null;
  isScrolled: boolean = false;
  isHighlightsPage: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sessionService: SessionService,
    private feedbackService: FeedbackService,
    private route: ActivatedRoute
  ) {};

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sessionId = params['id'];
    })

    this.isHighlightsPage = this.router.url.includes('/highlight');

    this.loadSession();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  loadSession(): void {
    this.sessionService.getSessionById(this.sessionId).subscribe({
      next: (response: any) => {
        this.session = response.data;
        this.membersCount = response.membersCount;

        this.creator = this.authService.isCreator(this.session?.createdBy._id);
        this.user = this.authService.getUser();
      },
      error: (err) => {
        console.error(`Error loading session: ${err}`);
        this.session = null;
      }
    });    
  }

  highlightSession(): void {
    this.router.navigate([`/session/${this.sessionId}/highlight`]);
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  isMemberCreator(memberId: string): boolean {
    if(memberId === this.session?.createdBy._id) {
      return true;
    } else {
      return false
    }
  }

  // Replace your existing export() method with this section-organized version

  // Enhanced version with custom visual indicators (no emojis, uses shapes and text)

// Replace your existing export() method with this version (using text symbols instead of emojis)

export(): void {
  this.feedbackService.getSessionFeedbacks(this.sessionId).subscribe({
    next: (response: any) => {
      const feedbacks = response.data;
      const doc = new jsPDF();
      
      // ========================================
      // HEADER SECTION
      // ========================================
      doc.setFillColor(41, 98, 255);
      doc.rect(0, 0, 210, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Session Feedback Report', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${this.session?.sessionName || 'N/A'}`, 105, 30, { align: 'center' });
      
      doc.setFontSize(9);
      doc.text(`Exported by: ${this.user?.username || 'Unknown'} | ${new Date().toLocaleString()}`, 105, 40, { align: 'center' });
      
      // ========================================
      // SESSION SUMMARY TABLE
      // ========================================
      const summaryData = [
        ['Session Name', this.session?.sessionName || 'N/A'],
        ['Total Feedbacks', feedbacks.length.toString()],
        ['Session Creator', this.session?.createdBy?.username || 'Unknown'],
        ['Members', this.membersCount.toString()]
      ];
      
      autoTable(doc, {
        startY: 60,
        head: [['Session Information', '']],
        body: summaryData,
        theme: 'grid',
        headStyles: {
          fillColor: [70, 130, 180],
          fontSize: 12,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 60, fontStyle: 'bold', fillColor: [245, 245, 245] },
          1: { cellWidth: 120 }
        },
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        margin: { left: 15, right: 15 }
      });
      
      let currentY = (doc as any).lastAutoTable.finalY + 20;
      
      // ========================================
      // ORGANIZE FEEDBACKS BY SECTION
      // ========================================
      
      // Group all feedback items by section
      const sectionMap = new Map<string, Array<{
        poster: string;
        items: string[];
        votes: number;
      }>>();
      
      feedbacks.forEach((fb: any) => {
        fb.sections.forEach((section: any) => {
          const sectionKey = section.title || section.key;
          
          if (!sectionMap.has(sectionKey)) {
            sectionMap.set(sectionKey, []);
          }
          
          sectionMap.get(sectionKey)!.push({
            poster: fb.feedbackPoster?.username || 'Anonymous',
            items: section.items || [],
            votes: fb.votes || 0
          });
        });
      });
      
      // ========================================
      // CREATE A TABLE FOR EACH SECTION
      // ========================================
      
      sectionMap.forEach((feedbackList, sectionKey) => {
        // Check if we need a new page
        if (currentY > 230) {
          doc.addPage();
          currentY = 25;
        }
        
        // ========================================
        // SECTION TITLE (Emphasized, not as table header)
        // ========================================
        
        currentY += 3;
        
        // Section title text
        doc.setTextColor(70, 130, 180);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(sectionKey, 15, currentY);
        
        currentY += 3;
        

        
        // ========================================
        // BUILD TABLE DATA
        // ========================================
        const tableData: any[] = [];
        
        feedbackList.forEach((feedback) => {
          // Add each feedback item as a row
          if (feedback.items && feedback.items.length > 0) {
            feedback.items.forEach((item: string) => {
              tableData.push([
                item,
                feedback.poster,
                feedback.votes > 0 ? feedback.votes.toString() : '-'
              ]);
            });
          } else {
            // If no items, still show the poster with empty content
            tableData.push([
              'No items',
              feedback.poster,
              feedback.votes > 0 ? feedback.votes.toString() : '-'
            ]);
          }
        });
        
        // ========================================
        // CREATE THE TABLE
        // ========================================
        autoTable(doc, {
          startY: currentY,
          head: [['Feedback', 'Posted By', 'Votes']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [70, 130, 180],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11,
            halign: 'left',
            cellPadding: { top: 6, right: 8, bottom: 6, left: 8 }
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { 
              cellWidth: 100, 
              valign: 'middle',
              halign: 'left',
              cellPadding: { top: 5, right: 8, bottom: 5, left: 8 }
            },
            1: { 
              cellWidth: 50, 
              valign: 'middle',
              halign: 'left',
              cellPadding: { top: 5, right: 8, bottom: 5, left: 8 }
            },
            2: { 
              cellWidth: 30, 
              halign: 'center', 
              valign: 'middle',
              cellPadding: { top: 5, right: 8, bottom: 5, left: 8 }
            }
          },
          styles: {
            fontSize: 10,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            textColor: [50, 50, 50]
          },
          margin: { left: 15, right: 15 },
          didDrawPage: (data) => {
            // Add page footer
            const pageCount = (doc.internal as any).getNumberOfPages();
            const currentPage = (doc.internal as any).getCurrentPageInfo().pageNumber;
            
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(20, 282, 190, 282);
            
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'normal');
            doc.text(
              `Page ${currentPage} of ${pageCount}`,
              105,
              287,
              { align: 'center' }
            );
          }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      });
      
      // ========================================
      // FINAL FOOTER
      // ========================================
      const totalPages = (doc.internal as any).getNumberOfPages();
      doc.setPage(totalPages);
      
      doc.setFillColor(245, 245, 245);
      doc.rect(0, 275, 210, 22, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'italic');
      doc.text('Generated by Feedback System', 105, 285, { align: 'center' });
      doc.text(`Total Feedbacks: ${feedbacks.length} | Sections: ${sectionMap.size}`, 105, 291, { align: 'center' });
      
      // Save the PDF
      doc.save(`${this.session?.sessionName}-feedbacks.pdf`);
    },
    error: (err) => {
      console.error('Error exporting feedbacks:', err.error?.message);
      alert(err.error?.message)
    }
  });
}
}
