

export default function TermsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg mx-auto max-w-3xl text-foreground">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Terms and Conditions
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="mt-12">1. Introduction</h2>
          <p>
            Welcome to ChatForge AI! These terms and conditions outline the rules and regulations for the use of our website and services. By accessing this website we assume you accept these terms and conditions. Do not continue to use ChatForge AI if you do not agree to take all of the terms and conditions stated on this page.
          </p>

          <h2 className="mt-8">2. Intellectual Property Rights</h2>
          <p>
            Other than the content you own, under these Terms, ChatForge AI and/or its licensors own all the intellectual property rights and materials contained in this Website. You are granted limited license only for purposes of viewing the material contained on this Website.
          </p>

          <h2 className="mt-8">3. Restrictions</h2>
          <p>You are specifically restricted from all of the following:</p>
          <ul>
            <li>Publishing any Website material in any other media.</li>
            <li>Selling, sublicensing and/or otherwise commercializing any Website material.</li>
            <li>Publicly performing and/or showing any Website material.</li>
            <li>Using this Website in any way that is or may be damaging to this Website.</li>
            <li>Using this Website in any way that impacts user access to this Website.</li>
            <li>Using this Website contrary to applicable laws and regulations, or in any way may cause harm to the Website, or to any person or business entity.</li>
            <li>Engaging in any data mining, data harvesting, data extracting or any other similar activity in relation to this Website.</li>
          </ul>

          <h2 className="mt-8">4. Your Content</h2>
          <p>
            In these Website Standard Terms and Conditions, “Your Content” shall mean any audio, video text, images or other material you choose to display on this Website. By displaying Your Content, you grant ChatForge AI a non-exclusive, worldwide irrevocable, sub-licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.
          </p>
          <p>
            Your Content must be your own and must not be invading any third-party’s rights. ChatForge AI reserves the right to remove any of Your Content from this Website at any time without notice.
          </p>

           <h2 className="mt-8">5. No warranties</h2>
          <p>
            This Website is provided “as is,” with all faults, and ChatForge AI express no representations or warranties, of any kind related to this Website or the materials contained on this Website.
          </p>

          <h2 className="mt-8">6. Limitation of liability</h2>
          <p>
            In no event shall ChatForge AI, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract.
          </p>
          
          <h2 className="mt-8">7. Indemnification</h2>
          <p>
            You hereby indemnify to the fullest extent ChatForge AI from and against any and/or all liabilities, costs, demands, causes of action, damages and expenses arising in any way related to your breach of any of the provisions of these Terms.
          </p>

          <h2 className="mt-8">8. Severability</h2>
          <p>
            If any provision of these Terms is found to be invalid under any applicable law, such provisions shall be deleted without affecting the remaining provisions herein.
          </p>

          <h2 className="mt-8">9. Variation of Terms</h2>
          <p>
            ChatForge AI is permitted to revise these Terms at any time as it sees fit, and by using this Website you are expected to review these Terms on a regular basis.
          </p>

          <h2 className="mt-8">10. Governing Law & Jurisdiction</h2>
          <p>
            These Terms will be governed by and interpreted in accordance with the laws of the jurisdiction in which the company is based, and you submit to the non-exclusive jurisdiction of the state and federal courts located there for the resolution of any disputes.
          </p>
        </div>
      </div>
    </div>
  );
}
