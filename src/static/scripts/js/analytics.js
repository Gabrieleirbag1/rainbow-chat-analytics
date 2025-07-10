async function getSummary() {
    try {
        const response = await fetch('/api/summary');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const summaryJson = await response.json();
        return summaryJson;
    } catch (error) {
        console.error('Error fetching summary:', error);
        return null;
    }
}

// Create a rainbow color palette based on number of senders
function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 360 / count) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
}

// Create a bar chart
function createBarChart(ctx, labels, data, title) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: generateColors(labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            if (title === "Characters") {
                                return `${value.toLocaleString()} characters`;
                            } else if (title === "Words") {
                                return `${value.toLocaleString()} words`;
                            }
                            return value;
                        }
                    }
                }
            }
        }
    });
}

// Create a pie chart
// Create a pie chart
function createPieChart(ctx, labels, data, title, colors) {
    const legendMarginPlugin = {
        id: 'legendMargin',
        beforeInit: (chart) => {
            // If legend is at the bottom, add extra space
            if (chart.options.plugins.legend.position === 'bottom') {
                chart.legend.bottom = 20;
            }
        }
    };
    
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors || generateColors(labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            layout: {
                padding: {
                    bottom: 15
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        boxWidth: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            
                            if (title === "Insults") {
                                return `${label}: ${value.toLocaleString()} insults (${percentage}%)`;
                            }
                            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        },
        plugins: [legendMarginPlugin]
    });
}

// Update the stat cards with summary data
function updateStatCards(summary) {
    document.getElementById('total-messages').textContent = summary.total_messages.toLocaleString();
    document.getElementById('unique-senders').textContent = summary.unique_senders.toLocaleString();
    document.getElementById('total-words').textContent = summary.total_words.toLocaleString();
    document.getElementById('total-characters').textContent = summary.total_characters.toLocaleString();
    
    // Add this line to update the new stat card
    if (summary.total_profanity !== undefined) {
        document.getElementById('total-profanity').textContent = summary.total_profanity.toLocaleString();
    }
}

// Update the participants list with sorted data
function updateParticipantsList(summary) {
    const participantsList = document.getElementById('participants-list');
    if (!participantsList) return;
    
    participantsList.innerHTML = ''; // Clear the list
    
    // Sort senders by message count for the list
    const sortedSenders = [...summary.unique_senders_list];
    sortedSenders.sort((a, b) => summary.messages_per_sender[b] - summary.messages_per_sender[a]);
    
    // Add participants to list with their message counts
    sortedSenders.forEach((sender) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="list-name" title="${sender}">${sender}</span>
            <span class="list-count">${summary.messages_per_sender[sender].toLocaleString()} messages</span>
        `;
        participantsList.appendChild(li);
    });
}

// Create pie chart for message distribution
function createMessageDistributionChart(summary) {
    const ctx = document.getElementById('senderChart');
    if (!ctx) return;
    
    const senders = summary.unique_senders_list;
    const messageCounts = senders.map(sender => summary.messages_per_sender[sender]);
    
    createPieChart(ctx.getContext('2d'), senders, messageCounts, "Messages");
}

// Create bar chart for character counts
function createCharactersChart(summary) {
    const charCtx = document.getElementById('charactersChart');
    if (!charCtx) return;
    
    const senders = summary.unique_senders_list;
    const charData = senders.map(sender => summary.character_count_per_sender[sender]);
    
    createBarChart(charCtx.getContext('2d'), senders, charData, "Characters");
}

// Create bar chart for word counts
function createWordsChart(summary) {
    const wordCtx = document.getElementById('wordsChart');
    if (!wordCtx) return;
    
    const senders = summary.unique_senders_list;
    const wordData = senders.map(sender => summary.word_count_per_sender[sender]);
    
    createBarChart(wordCtx.getContext('2d'), senders, wordData, "Words");
}

// Update profanity list with sorted data
function updateProfanityList(summary, sendersWithProfanity) {
    const profanityList = document.getElementById('profanity-list');
    if (!profanityList) return;
    
    profanityList.innerHTML = '';
    
    // Sort senders by profanity count
    const sortedProfanitySenders = [...sendersWithProfanity];
    sortedProfanitySenders.sort((a, b) => 
        summary.profanity_count_per_sender[b] - summary.profanity_count_per_sender[a]
    );
    
    sortedProfanitySenders.forEach((sender) => {
        const count = summary.profanity_count_per_sender[sender];
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="list-name" title="${sender}">${sender}</span>
            <span class="list-count">${count} insulte${count > 1 ? 's' : ''}</span>
        `;
        profanityList.appendChild(li);
    });
}

// Show profanity words list
function showProfanityWordsList(summary) {
    const profanityWords = document.getElementById('profanity-words');
    if (!profanityWords || !summary.profanity_list) return;
    
    profanityWords.textContent = summary.profanity_list.join(', ');
}

// Handle no profanity case
function handleNoProfanityFound(summary, profanityCtx) {
    const chartContainer = profanityCtx.canvas.parentNode;
    chartContainer.innerHTML = '<p class="no-data">No insults found in the conversation</p>';
    
    const profanityList = document.getElementById('profanity-list');
    if (profanityList) {
        profanityList.innerHTML = '<li>No insults detected</li>';
    }
    
    showProfanityWordsList(summary);
}

// Create profanity chart and related elements
function createProfanityChart(summary) {
    if (!summary.profanity_count_per_sender) return;
    
    const profanityCtx = document.getElementById('profanityChart');
    if (!profanityCtx) return;
    
    const senders = summary.unique_senders_list;
    
    // Filter out senders with no profanity
    const sendersWithProfanity = senders.filter(sender => summary.profanity_count_per_sender[sender] > 0);
    const profanityData = sendersWithProfanity.map(sender => summary.profanity_count_per_sender[sender]);
    
    // Use vibrant colors for profanity chart
    const profanityColors = generateColors(sendersWithProfanity.length).map(color => color.replace('60%', '50%'));
    
    // Only create chart if there's data
    if (sendersWithProfanity.length > 0) {
        createPieChart(profanityCtx.getContext('2d'), sendersWithProfanity, profanityData, "Insults", profanityColors);
        updateProfanityList(summary, sendersWithProfanity);
        showProfanityWordsList(summary);
    } else {
        handleNoProfanityFound(summary, profanityCtx.getContext('2d'));
    }
}

// Main function to update the page with summary data
async function updatePageWithSummary() {
    const summary = await getSummary();
    if (!summary) return;
    
    updateStatCards(summary);
    updateParticipantsList(summary);
    createMessageDistributionChart(summary);
    createCharactersChart(summary);
    createWordsChart(summary);
    createProfanityChart(summary);
}

document.addEventListener('DOMContentLoaded', updatePageWithSummary);