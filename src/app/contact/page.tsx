
import type { Metadata } from 'next';
import ContactForm from '../../components/ContactForm';

export const metadata: Metadata = {
    title: 'Contact Us - Filmospere',
    description: 'Get in touch with the Filmospere team for inquiries, feedback, or support.',
    alternates: {
        canonical: 'https://filmospere.com/contact'
    }
};

export default function ContactPage() {
    return <ContactForm />;
}
