async function getSummary() {
    const summaryDiv = document.getElementById("summary");
    try {
        const response = await fetch('/api/summary');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const summaryJson = await response.json();
        return summaryJson;
    } catch (error) {
        console.error('Error fetching summary:', error);
        summaryDiv.innerHTML = 'Error loading summary data';
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

async function updatePageWithSummary() {
    const summary = await getSummary();
    if (!summary) return;
    
    // Update stat cards
    document.getElementById('total-messages').textContent = summary.total_messages;
    document.getElementById('unique-senders').textContent = summary.unique_senders;
    document.getElementById('total-words').textContent = summary.total_words;
    document.getElementById('total-characters').textContent = summary.total_characters;
    
    // Update participants list
    const participantsList = document.getElementById('participants-list');
    participantsList.innerHTML = ''; // Clear the list
    
    // Get sender names and message counts
    const senders = summary.unique_senders_list;
    const messageCounts = senders.map(sender => summary.messages_per_sender[sender]);
    
    // Add participants to list with their message counts
    senders.forEach((sender, index) => {
        const li = document.createElement('li');
        li.textContent = `${sender}: ${messageCounts[index]} messages`;
        participantsList.appendChild(li);
    });
    
    // Create pie chart with actual message counts
    const ctx = document.getElementById('senderChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: senders,
            datasets: [{
                data: messageCounts,
                backgroundColor: generateColors(senders.length),
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
                            return `${label}: ${value} messages (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', updatePageWithSummary);