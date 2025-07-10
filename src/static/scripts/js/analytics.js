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

// Generate data for the chart (equal distribution since we don't have per-user message counts)
function createDummyData(length) {
    return Array(length).fill(100);
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
    summary.unique_senders_list.forEach(sender => {
        const li = document.createElement('li');
        li.textContent = sender;
        participantsList.appendChild(li);
    });
    
    // Create pie chart
    const ctx = document.getElementById('senderChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: summary.unique_senders_list,
            datasets: [{
                data: createDummyData(summary.unique_senders_list.length),
                backgroundColor: generateColors(summary.unique_senders_list.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', updatePageWithSummary);