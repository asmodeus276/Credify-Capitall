import { ContentLibrary } from './content-library.js';

export const initIntelligence = (loanType) => {
    const container = document.getElementById('intelligence-container');
    const data = ContentLibrary[loanType];

    if (!container || !data) return;

    // Build the dynamic UI with the new CTA
    container.innerHTML = `
        <div class="space-y-6 animate-fade-in border-t border-gray-100 pt-8">
            <h2 class="text-2xl font-bold text-primary">Smart Financial Insights</h2>
            <div class="grid md:grid-cols-2 gap-8">
                <div class="faq-section">
                    <h3 class="font-bold text-lg mb-4">Frequently Asked Questions</h3>
                    ${data.faqs.map(item => `
                        <details class="mb-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <summary class="font-medium cursor-pointer">${item.q}</summary>
                            <p class="mt-2 text-gray-600 text-sm">${item.a}</p>
                        </details>
                    `).join('')}
                </div>
                <div class="resources-section">
                    <h3 class="font-bold text-lg mb-4">Recommended Resources</h3>
                    <ul class="list-disc pl-5 text-secondary space-y-2 mb-6">
                        ${data.resources.map(res => `<li><a href="#" class="hover:underline">${res}</a></li>`).join('')}
                    </ul>
                    
                    ${data.calculator ? `
                        <div class="p-4 bg-primary text-white rounded-lg flex items-center justify-between shadow-lg">
                            <span class="font-semibold">${data.calculator.label}</span>
                            <a href="${data.calculator.url}" class="bg-secondary px-4 py-2 rounded hover:brightness-110 transition-all text-sm font-bold">
                                Get Started →
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
};
