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
function createPieChart(ctx, labels, data, title, colors) {
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
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            
                            if (title === "Insultes") {
                                return `${label}: ${value.toLocaleString()} insultes (${percentage}%)`;
                            }
                            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

async function updatePageWithSummary() {
    const summary = await getSummary();
    if (!summary) return;
    
    // Update stat cards
    document.getElementById('total-messages').textContent = summary.total_messages.toLocaleString();
    document.getElementById('unique-senders').textContent = summary.unique_senders.toLocaleString();
    document.getElementById('total-words').textContent = summary.total_words.toLocaleString();
    document.getElementById('total-characters').textContent = summary.total_characters.toLocaleString();
    
    // Update participants list
    const participantsList = document.getElementById('participants-list');
    participantsList.innerHTML = ''; // Clear the list
    
    // Get sender names and message counts
    const senders = summary.unique_senders_list;
    const messageCounts = senders.map(sender => summary.messages_per_sender[sender]);
    
    // Sort senders by message count for the list
    const sortedSenders = [...senders];
    sortedSenders.sort((a, b) => summary.messages_per_sender[b] - summary.messages_per_sender[a]);
    
    // Add participants to list with their message counts
    sortedSenders.forEach((sender) => {
        const li = document.createElement('li');
        li.textContent = `${sender}: ${summary.messages_per_sender[sender].toLocaleString()} messages`;
        participantsList.appendChild(li);
    });
    
    // Create pie chart with actual message counts
    const ctx = document.getElementById('senderChart').getContext('2d');
    createPieChart(ctx, senders, messageCounts, "Messages");
    
    // Characters chart
    const charCtx = document.getElementById('charactersChart').getContext('2d');
    const charData = senders.map(sender => summary.character_count_per_sender[sender]);
    createBarChart(charCtx, senders, charData, "Characters");
    
    // Words chart
    const wordCtx = document.getElementById('wordsChart').getContext('2d');
    const wordData = senders.map(sender => summary.word_count_per_sender[sender]);
    createBarChart(wordCtx, senders, wordData, "Words");
    
    // Profanity chart
    if (summary.profanity_count_per_sender && document.getElementById('profanityChart')) {
        const profanityCtx = document.getElementById('profanityChart').getContext('2d');
        
        // Filter out senders with no profanity
        const sendersWithProfanity = senders.filter(sender => summary.profanity_count_per_sender[sender] > 0);
        const profanityData = sendersWithProfanity.map(sender => summary.profanity_count_per_sender[sender]);
        
        // Use vibrant colors for profanity chart
        const profanityColors = generateColors(sendersWithProfanity.length).map(color => color.replace('60%', '50%'));
        
        // Only create chart if there's data
        if (sendersWithProfanity.length > 0) {
            createPieChart(profanityCtx, sendersWithProfanity, profanityData, "Insultes", profanityColors);
            
            // Update profanity list
            const profanityList = document.getElementById('profanity-list');
            if (profanityList) {
                profanityList.innerHTML = '';
                
                // Sort senders by profanity count
                const sortedProfanitySenders = [...sendersWithProfanity];
                sortedProfanitySenders.sort((a, b) => 
                    summary.profanity_count_per_sender[b] - summary.profanity_count_per_sender[a]
                );
                
                sortedProfanitySenders.forEach((sender) => {
                    const count = summary.profanity_count_per_sender[sender];
                    const li = document.createElement('li');
                    li.textContent = `${sender}: ${count} insulte${count > 1 ? 's' : ''}`;
                    profanityList.appendChild(li);
                });
            }
            
            // Show profanity words list
            const profanityWords = document.getElementById('profanity-words');
            if (profanityWords && summary.profanity_list) {
                profanityWords.textContent = summary.profanity_list.join(', ');
            }
        } else {
            // No profanity found
            const chartContainer = profanityCtx.canvas.parentNode;
            chartContainer.innerHTML = '<p class="no-data">Aucune insulte trouvée dans la conversation</p>';
            
            const profanityList = document.getElementById('profanity-list');
            if (profanityList) {
                profanityList.innerHTML = '<li>Aucune insulte détectée</li>';
            }
            
            // Show profanity words list anyway
            const profanityWords = document.getElementById('profanity-words');
            if (profanityWords && summary.profanity_list) {
                profanityWords.textContent = summary.profanity_list.join(', ');
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', updatePageWithSummary);