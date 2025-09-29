

export default function PrivacyPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg mx-auto max-w-3xl text-foreground">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="mt-12">1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us. For example, we collect information when you create an account, subscribe, participate in any interactive features of our services, fill out a form, request customer support, or otherwise communicate with us. The types of information we may collect include your name, email address, postal address, credit card information, and other contact or identifying information you choose to provide.
          </p>

          <h2 className="mt-8">2. How We Use Information</h2>
          <p>We may use the information we collect for various purposes, including to:</p>
          <ul>
            <li>Provide, maintain, and improve our services;</li>
            <li>Process transactions and send you related information, including confirmations and invoices;</li>
            <li>Send you technical notices, updates, security alerts, and support and administrative messages;</li>
            <li>Respond to your comments, questions, and requests, and provide customer service;</li>
            <li>Communicate with you about products, services, offers, promotions, rewards, and events offered by ChatForge AI and others, and provide news and information we think will be of interest to you.</li>
          </ul>

          <h2 className="mt-8">3. Sharing of Information</h2>
          <p>
            We may share information about you as follows or as otherwise described in this Privacy Policy:
          </p>
          <ul>
            <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf;</li>
            <li>In response to a request for information if we believe disclosure is in accordance with any applicable law, regulation, or legal process;</li>
            <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of ChatForge AI or others.</li>
          </ul>

          <h2 className="mt-8">4. Data Security</h2>
          <p>
            We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
          </p>

          <h2 className="mt-8">5. Your Choices</h2>
          <p>
            You may update, correct or delete information about you at any time by logging into your online account or emailing us. If you wish to delete or deactivate your account, please email us, but note that we may retain certain information as required by law or for legitimate business purposes.
          </p>

          <h2 className="mt-8">6. Children's Privacy</h2>
          <p>
            Our services are not directed to children, and we do not knowingly collect personal information from children under the age of 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete such information.
          </p>

          <h2 className="mt-8">7. Changes to the Privacy Policy</h2>
          <p>
            We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our homepage or sending you a notification).
          </p>
        </div>
      </div>
    </div>
  );
}
