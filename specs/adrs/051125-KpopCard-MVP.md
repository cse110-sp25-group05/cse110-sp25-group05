| **Key**              | **Value**                           |
|----------------------|-------------------------------------|
| **Status**           | accepted                            |
| **Date**             | 2025-05-11                          |
| **Decision Makers**  | Project Team                        |
| **Consulted**        | Leaders and Project Team            |
| **Informed**         | Course Instructors                  |

# Define MVP Scope for K-Pop Card Collecting App

## Context and Problem Statement

We have 10 weeks to ship a working K-Pop virtual card–collecting demo. Meeting notes list many desired features, but trying to build them all at once risks missed deadlines and diluted quality. **Which feature set should we lock in for the initial release (MVP) so we can learn quickly and avoid organizational debt?**

## Decision Drivers

* **Course deadline** – working demo due Week 10  
* **Team capacity** – small student team, part-time bandwidth  
* **User value early** – pack-opening loop is the core engagement mechanic  
* **Risk reduction** – smaller scope lowers implementation and integration risk  

## Considered Options

1. **O1 – Full Feature Set Now**  
   Ship currency, trading, multiple groups, and advanced customization in v1.

2. **O2 – Focused MVP** *(chosen)*  
   Launch with a single group, pack-opening, gallery, and basic personalization (≤ 5 preset stickers/frames).

3. **O3 – Postpone Launch Until All Features Ready**  
   Delay release until every vision feature is complete.

## Decision Outcome

**Chosen option: O2 – Focused MVP**

### Consequences

* *Positive* – Earliest user feedback, clearer grading alignment, lower scope creep.  
* *Negative* – Requires post-launch work to add currency, trading, and more groups.  

Implementation tickets are open in GitHub and linked to this ADR. Future ADRs will reference this document whenever stretch-goal features are added or superseded.

## Pros and Cons of the Options

### O1 – Full Feature Set Now
* Good, because the complete product vision is achieved sooner.  
* Bad, because high complexity risks missing the deadline.  
* Bad, because limited opportunity for iterative feedback.  

### O2 – Focused MVP (chosen)
* Good, because it satisfies the core user journey and course requirements early.  
* Good, because it allows incremental additions via future ADRs.  
* Neutral, because later refactors will be needed for added systems.  
* Bad, because the initial launch has fewer engagement loops.  

### O3 – Postpone Launch Until All Features Ready
* Good, because rework from incremental releases is avoided.  
* Bad, because no working product appears until late; high grading risk.  
* Bad, because there is no time for user-testing cycles.  

## More Information

Superseding ADRs will reference this document when we introduce virtual currency, trading, additional groups, or advanced customization features.
